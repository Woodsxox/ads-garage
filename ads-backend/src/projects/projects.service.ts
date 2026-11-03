import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntitlementsService } from '../plans/entitlements.service.js';
import { PLAN_CATALOG } from '../plans/plan-catalog.js';
import type { DesignInput } from './design.types.js';
import { validateDesign } from './design.validator.js';
import type { ListProjectsQuery } from './dto/list-projects.dto.js';
import { Project, type ProjectResponse, toProjectResponse } from './project.entity.js';
import { findFormat } from './studio-formats.js';

export interface ProjectList {
  items: ProjectResponse[];
  total: number;
  limit: number;
  offset: number;
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (m) => `\\${m}`);

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    private readonly entitlements: EntitlementsService,
  ) {}

  async list(userId: string, query: ListProjectsQuery): Promise<ProjectList> {
    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;

    const qb = this.projects.createQueryBuilder('p').where('p.userId = :userId', { userId });
    if (query.status) qb.andWhere('p.status = :status', { status: query.status });
    if (query.q) qb.andWhere("LOWER(p.name) LIKE :q ESCAPE '\\'", { q: `%${escapeLike(query.q.toLowerCase())}%` });
    if (query.sort === 'name') qb.orderBy('p.name', 'ASC');
    else qb.orderBy('p.updatedAt', 'DESC');
    qb.addOrderBy('p.id', 'ASC').skip(offset).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    return { items: rows.map(toProjectResponse), total, limit, offset };
  }

  async get(userId: string, id: string): Promise<ProjectResponse> {
    return toProjectResponse(await this.findOwned(userId, id));
  }

  async create(userId: string, body: unknown): Promise<ProjectResponse> {
    const design = this.parse(body);
    await this.assertCanCreate(userId);
    await this.assertFormatAllowed(userId, design.formatId);
    return toProjectResponse(await this.projects.save(this.projects.create(this.toColumns(userId, design))));
  }

  /** Replaces the whole design. The editor always sends the full document. */
  async replace(userId: string, id: string, body: unknown): Promise<ProjectResponse> {
    const existing = await this.findOwned(userId, id);
    const design = this.parse(body);
    // A design keeps its current format even after a downgrade. Only switching to a Pro format is gated.
    if (design.formatId !== existing.formatId) await this.assertFormatAllowed(userId, design.formatId);
    const saved = await this.projects.save(this.projects.merge(existing, this.toColumns(userId, design)));
    return toProjectResponse(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const result = await this.projects.delete({ id, userId });
    if (!result.affected) throw new NotFoundException({ message: 'Project not found', code: 'PROJECT_NOT_FOUND' });
  }

  async duplicate(userId: string, id: string): Promise<ProjectResponse> {
    const source = await this.findOwned(userId, id);
    await this.assertCanCreate(userId);
    const copy = this.projects.create({
      userId,
      name: `${source.name} (copy)`.slice(0, 120),
      formatId: source.formatId,
      width: source.width,
      height: source.height,
      status: 'draft',
      templateId: source.templateId,
      content: structuredClone(source.content),
    });
    return toProjectResponse(await this.projects.save(copy));
  }

  /** Used by other modules (campaigns) that need to read a design the caller owns. */
  async findOwned(userId: string, id: string): Promise<Project> {
    // Same answer for "does not exist" and "belongs to someone else", so ids cannot be probed.
    const project = await this.projects.findOneBy({ id, userId });
    if (!project) throw new NotFoundException({ message: 'Project not found', code: 'PROJECT_NOT_FOUND' });
    return project;
  }

  private parse(body: unknown): DesignInput {
    const result = validateDesign(body);
    if (!result.ok) {
      throw new UnprocessableEntityException({
        message: 'The design is not valid',
        code: 'INVALID_DESIGN',
        details: result.errors,
      });
    }
    return result.value;
  }

  private toColumns(userId: string, design: DesignInput): Partial<Project> {
    return {
      userId,
      name: design.name,
      formatId: design.formatId,
      width: design.width,
      height: design.height,
      status: design.status,
      templateId: design.templateId ?? null,
      content: { background: design.background, elements: design.elements },
    };
  }

  private async assertCanCreate(userId: string): Promise<void> {
    const [limits, count] = await Promise.all([this.entitlements.getLimits(userId), this.projects.countBy({ userId })]);
    if (count >= limits.maxProjects) {
      throw new ForbiddenException({
        message: `You have reached the limit of ${limits.maxProjects} saved designs on your plan`,
        code: 'PROJECT_LIMIT_REACHED',
        details: { limit: limits.maxProjects },
      });
    }
  }

  private async assertFormatAllowed(userId: string, formatId: string): Promise<void> {
    if (!findFormat(formatId)?.pro) return;
    if (!(await this.entitlements.getLimits(userId)).proFormats) {
      throw new ForbiddenException({
        message: `The ${formatId} format needs the ${PLAN_CATALOG.pro.name} plan or higher`,
        code: 'FORMAT_REQUIRES_PRO',
        details: { formatId },
      });
    }
  }
}
