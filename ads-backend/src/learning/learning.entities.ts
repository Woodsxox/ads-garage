import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity.js';

@Entity('lesson_progress')
@Unique(['userId', 'lessonSlug'])
export class LessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 80 })
  lessonSlug: string;

  /** The furthest step reached. Only ever moves forward. */
  @Column({ type: 'int', default: 0 })
  furthestStep: number;

  /** Best score across attempts, 0 to 100. Null until the first submission. */
  @Column({ type: 'int', nullable: true })
  bestScore: number | null;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: Date, nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('user_badges')
@Unique(['userId', 'badgeId'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 64 })
  badgeId: string;

  @CreateDateColumn()
  awardedAt: Date;
}
