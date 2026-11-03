import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntitlementsService } from '../plans/entitlements.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import type { CreateCampaignDto } from './dto/integrations.dto.js';
import { Campaign, ConnectedAccount } from './integrations.entities.js';
import { PlatformConnector, type CampaignStatus } from './platform-connector.js';
import { checkDesignForPlatform, findPlatform, type Platform, type PlatformId, PLATFORMS } from './platforms.js';

export interface AccountView {
  platformId: PlatformId;
  accountName: string;
  accountId: string;
  connectedAt: string;
  simulated: boolean;
}

export interface CampaignView {
  id: string;
  name: string;
  platformId: PlatformId;
  designId: string | null;
  designName: string;
  objective: Campaign['objective'];
  dailyBudget: number;
  startDate: string;
  endDate: string;
  audience: string;
  status: CampaignStatus;
  submittedAt: string;
  simulated: boolean;
}

const isRealDate = (value: string): boolean => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
};

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly connector: PlatformConnector,
    private readonly entitlements: EntitlementsService,
    private readonly projects: ProjectsService,
    @InjectRepository(ConnectedAccount) private readonly accounts: Repository<ConnectedAccount>,
    @InjectRepository(Campaign) private readonly campaigns: Repository<Campaign>,
  ) {}

  listPlatforms(): readonly Platform[] {
    return PLATFORMS;
  }

  async listAccounts(userId: string): Promise<AccountView[]> {
    const rows = await this.accounts.find({ where: { userId }, order: { connectedAt: 'ASC' } });
    return rows.map((row) => this.accountView(row));
  }

  async connect(userId: string, platformId: PlatformId): Promise<AccountView> {
    const limits = await this.entitlements.getLimits(userId);
    const existing = await this.accounts.findOneBy({ userId, platformId });
    if (!existing && (await this.accounts.countBy({ userId })) >= limits.maxConnectedAccounts) {
      throw new ForbiddenException({
        message: `Your plan allows ${limits.maxConnectedAccounts} connected accounts`,
        code: 'ACCOUNT_LIMIT_REACHED',
        details: { limit: limits.maxConnectedAccounts },
      });
    }

    const info = await this.connector.connect(userId, platformId);
    const values = { accountId: info.accountId, accountName: info.accountName, simulated: this.connector.simulated };
    const saved = existing
      ? await this.accounts.save(this.accounts.merge(existing, values))
      : await this.accounts.save(this.accounts.create({ userId, platformId, ...values }));
    return this.accountView(saved);
  }

  /** Allowed on any plan, so someone who downgrades can still cut a platform's access. */
  async disconnect(userId: string, platformId: PlatformId): Promise<void> {
    const result = await this.accounts.delete({ userId, platformId });
    if (!result.affected) throw new NotFoundException({ message: 'That platform is not connected', code: 'ACCOUNT_NOT_FOUND' });
  }

  async listCampaigns(userId: string, now = new Date()): Promise<CampaignView[]> {
    const rows = await this.campaigns.find({ where: { userId }, order: { submittedAt: 'DESC' } });
    return rows.map((row) => this.campaignView(row, now));
  }

  async submitCampaign(userId: string, dto: CreateCampaignDto, now = new Date()): Promise<CampaignView> {
    const platform = findPlatform(dto.platformId)!; // The DTO already restricted this to known ids.
    this.assertDates(dto, now);

    const account = await this.accounts.findOneBy({ userId, platformId: dto.platformId });
    if (!account) {
      throw new ConflictException({ message: `Connect ${platform.name} first`, code: 'ACCOUNT_NOT_CONNECTED', details: { platformId: dto.platformId } });
    }

    const project = await this.projects.findOwned(userId, dto.projectId);
    const failed = checkDesignForPlatform({ width: project.width, height: project.height, elements: project.content.elements }, platform).filter(
      (check) => check.status === 'fail',
    );
    if (failed.length > 0) {
      throw new UnprocessableEntityException({
        message: `This design does not meet ${platform.name} requirements`,
        code: 'CAMPAIGN_CHECKS_FAILED',
        details: failed,
      });
    }

    const dailyBudgetCents = Math.round(dto.dailyBudget * 100);
    const { externalId } = await this.connector.submitCampaign({
      platformId: dto.platformId,
      accountId: account.accountId,
      name: dto.name,
      objective: dto.objective,
      dailyBudgetCents,
      startDate: dto.startDate,
      endDate: dto.endDate,
      audience: dto.audience,
    });

    const saved = await this.campaigns.save(
      this.campaigns.create({
        userId,
        projectId: project.id,
        designName: project.name,
        platformId: dto.platformId,
        name: dto.name,
        objective: dto.objective,
        dailyBudgetCents,
        startDate: dto.startDate,
        endDate: dto.endDate,
        audience: dto.audience,
        status: 'in_review',
        externalId,
        simulated: this.connector.simulated,
        submittedAt: now,
      }),
    );
    return this.campaignView(saved, now);
  }

  private assertDates(dto: CreateCampaignDto, now: Date): void {
    const problems: string[] = [];
    if (!isRealDate(dto.startDate)) problems.push('startDate is not a real date');
    if (!isRealDate(dto.endDate)) problems.push('endDate is not a real date');
    if (problems.length === 0) {
      if (dto.endDate < dto.startDate) problems.push('endDate must not be before startDate');
      if (dto.endDate < now.toISOString().slice(0, 10)) problems.push('endDate is in the past');
    }
    if (problems.length > 0) {
      throw new UnprocessableEntityException({ message: 'The campaign dates are not valid', code: 'INVALID_CAMPAIGN_DATES', details: problems });
    }
  }

  private accountView(row: ConnectedAccount): AccountView {
    return {
      platformId: row.platformId,
      accountName: row.accountName,
      accountId: row.accountId,
      connectedAt: row.connectedAt.toISOString(),
      simulated: row.simulated,
    };
  }

  private campaignView(row: Campaign, now: Date): CampaignView {
    return {
      id: row.id,
      name: row.name,
      platformId: row.platformId,
      designId: row.projectId,
      designName: row.designName,
      objective: row.objective,
      dailyBudget: row.dailyBudgetCents / 100,
      startDate: row.startDate,
      endDate: row.endDate,
      audience: row.audience,
      status: row.simulated ? this.connector.statusOf({ submittedAt: row.submittedAt, status: row.status }, now) : row.status,
      submittedAt: row.submittedAt.toISOString(),
      simulated: row.simulated,
    };
  }
}
