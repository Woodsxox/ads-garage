import { BadGatewayException, BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EntitlementsService } from '../plans/entitlements.service.js';
import { PLAN_CATALOG, type PlanId, planAtLeast } from '../plans/plan-catalog.js';
import { User } from '../users/user.entity.js';
import { AI_MODELS, type AiModel, defaultModelFor, findModel } from './ai-models.js';
import { AiUsage } from './ai-usage.entity.js';
import { AiProvider, type CopyVariation } from './ai.provider.js';
import type { GenerateCopyDto } from './dto/ai.dto.js';

export interface UsageSummary {
  period: string;
  used: number;
  allowance: number;
  remaining: number;
  /** When the allowance resets: the start of the next UTC month. */
  resetsAt: string;
}

export interface CopyResult {
  model: { id: string; label: string };
  variations: CopyVariation[];
  creditsCharged: number;
  usage: UsageSummary;
}

export const periodOf = (date: Date): string => date.toISOString().slice(0, 7);
const nextPeriodStart = (date: Date): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

const rank = (plan: PlanId): number => PLAN_CATALOG[plan].rank;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly provider: AiProvider,
    private readonly entitlements: EntitlementsService,
    private readonly dataSource: DataSource,
    @InjectRepository(AiUsage) private readonly usage: Repository<AiUsage>,
  ) {}

  /** Every model, flagged with whether the caller's plan may use it. */
  async listModels(userId: string): Promise<(Omit<AiModel, 'provider'> & { available: boolean })[]> {
    const plan = await this.entitlements.getPlanId(userId);
    return AI_MODELS.map(({ provider: _provider, ...model }) => ({ ...model, available: planAtLeast(plan, model.minPlan) }));
  }

  async getUsage(userId: string, now = new Date()): Promise<UsageSummary> {
    const limits = await this.entitlements.getLimits(userId);
    return this.summarise(await this.usedCredits(this.usage, userId, periodOf(now)), limits.aiCreditsPerMonth, now);
  }

  async generateCopy(userId: string, dto: GenerateCopyDto, now = new Date()): Promise<CopyResult> {
    const plan = await this.entitlements.getPlanId(userId);
    const model = this.resolveModel(dto.model, plan);
    const allowance = PLAN_CATALOG[plan].limits.aiCreditsPerMonth;
    const period = periodOf(now);

    // Reserve the credits first, then call the provider. A failed call refunds, so a crash or a
    // provider error never costs the user, and two requests cannot both spend the same credits.
    const reservation = await this.reserve(userId, model, period, allowance, now);

    let variations: CopyVariation[];
    try {
      variations = await this.provider.generateCopy({
        prompt: dto.prompt,
        tone: dto.tone ?? 'friendly',
        variations: dto.variations ?? 3,
        maxHeadlineChars: dto.maxHeadlineChars ?? 40,
        modelId: model.id,
      });
    } catch (error) {
      await this.usage.delete({ id: reservation });
      this.logger.error(`Provider failed for model ${model.id}`, error instanceof Error ? error.stack : String(error));
      throw new BadGatewayException({ message: 'The AI provider failed. You were not charged', code: 'AI_PROVIDER_ERROR' });
    }

    const used = await this.usedCredits(this.usage, userId, period);
    return {
      model: { id: model.id, label: model.label },
      variations,
      creditsCharged: model.creditCost,
      usage: this.summarise(used, allowance, now),
    };
  }

  private resolveModel(requested: string | undefined, plan: PlanId): AiModel {
    if (!requested) return defaultModelFor(rank, plan);
    const model = findModel(requested);
    if (!model) throw new BadRequestException({ message: `Unknown model "${requested}"`, code: 'UNKNOWN_MODEL' });
    if (!planAtLeast(plan, model.minPlan)) {
      throw new ForbiddenException({
        message: `The ${model.label} model needs the ${PLAN_CATALOG[model.minPlan].name} plan or higher`,
        code: 'MODEL_REQUIRES_PLAN',
        details: { model: model.id, required: model.minPlan, current: plan },
      });
    }
    return model;
  }

  /** Checks the allowance and records the spend in one transaction. Returns the usage row id. */
  private async reserve(userId: string, model: AiModel, period: string, allowance: number, now: Date): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      // On Postgres, lock the user row so concurrent requests from one user run one at a time.
      // SQLite has a single writer already and does not support row locks.
      if (this.dataSource.options.type === 'postgres') {
        await manager.createQueryBuilder(User, 'u').setLock('pessimistic_write').where('u.id = :userId', { userId }).getOne();
      }
      const repo = manager.getRepository(AiUsage);
      const used = await this.usedCredits(repo, userId, period);
      if (used + model.creditCost > allowance) {
        throw new HttpException(
          {
            message: 'You have used all your AI credits for this month',
            code: 'AI_QUOTA_EXCEEDED',
            details: this.summarise(used, allowance, now),
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      const row = await repo.save(repo.create({ userId, period, credits: model.creditCost, modelId: model.id, kind: model.kind }));
      return row.id;
    });
  }

  private async usedCredits(repo: Repository<AiUsage>, userId: string, period: string): Promise<number> {
    const row = await repo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.credits), 0)', 'total')
      .where('u.userId = :userId AND u.period = :period', { userId, period })
      .getRawOne<{ total: string | number }>();
    return Number(row?.total ?? 0);
  }

  private summarise(used: number, allowance: number, now: Date): UsageSummary {
    return {
      period: periodOf(now),
      used,
      allowance,
      remaining: Math.max(0, allowance - used),
      resetsAt: nextPeriodStart(now).toISOString(),
    };
  }
}
