import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity.js';
import type { Background, DesignElement, DesignStatus } from './design.types.js';

@Entity('projects')
@Index(['userId', 'updatedAt'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 16 })
  formatId: string;

  @Column({ type: 'int' })
  width: number;

  @Column({ type: 'int' })
  height: number;

  @Column({ type: 'varchar', length: 16 })
  status: DesignStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  templateId: string | null;

  /** The visual content (background and elements). Validated before it is stored, never trusted on read. */
  @Column({ type: 'simple-json' })
  content: { background: Background; elements: DesignElement[] };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** The API shape of a project. Identical to the web app's `AdDesign`. */
export interface ProjectResponse {
  id: string;
  name: string;
  formatId: string;
  width: number;
  height: number;
  status: DesignStatus;
  templateId?: string;
  background: Background;
  elements: DesignElement[];
  createdAt: string;
  updatedAt: string;
}

export function toProjectResponse(project: Project): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    formatId: project.formatId,
    width: project.width,
    height: project.height,
    status: project.status,
    ...(project.templateId ? { templateId: project.templateId } : {}),
    background: project.content.background,
    elements: project.content.elements,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
