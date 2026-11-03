import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity.js';

/** One row per generation. A month's usage is the sum of `credits` for that `period`. */
@Entity('ai_usage')
@Index(['userId', 'period'])
export class AiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /** Calendar month in UTC, `YYYY-MM`. */
  @Column({ type: 'varchar', length: 7 })
  period: string;

  @Column({ type: 'int' })
  credits: number;

  @Column({ type: 'varchar', length: 64 })
  modelId: string;

  @Column({ type: 'varchar', length: 16 })
  kind: string;

  @CreateDateColumn()
  createdAt: Date;
}
