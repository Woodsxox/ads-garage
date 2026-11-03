import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Project } from '../projects/project.entity.js';
import { User } from '../users/user.entity.js';
import type { CampaignStatus } from './platform-connector.js';
import type { PlatformId } from './platforms.js';

@Entity('connected_accounts')
@Unique(['userId', 'platformId'])
export class ConnectedAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 32 })
  platformId: PlatformId;

  @Column({ type: 'varchar', length: 120 })
  accountName: string;

  @Column({ type: 'varchar', length: 120 })
  accountId: string;

  /** True while the connection is a simulation. Real OAuth tokens will be added as encrypted columns. */
  @Column({ type: 'boolean', default: true })
  simulated: boolean;

  @CreateDateColumn()
  connectedAt: Date;
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /** Kept if the design is deleted, so the campaign history stays readable. */
  @Column({ type: 'varchar', length: 36, nullable: true })
  projectId: string | null;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'projectId' })
  project?: Project | null;

  /** A snapshot of the design name when submitted. */
  @Column({ type: 'varchar', length: 120 })
  designName: string;

  @Column({ type: 'varchar', length: 32 })
  platformId: PlatformId;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 16 })
  objective: 'traffic' | 'awareness' | 'conversions';

  /** Whole cents, so money is never a float. */
  @Column({ type: 'int' })
  dailyBudgetCents: number;

  /** `YYYY-MM-DD`. */
  @Column({ type: 'varchar', length: 10 })
  startDate: string;

  @Column({ type: 'varchar', length: 10 })
  endDate: string;

  @Column({ type: 'varchar', length: 200 })
  audience: string;

  /** The status at submission. Live status comes from the connector. */
  @Column({ type: 'varchar', length: 16 })
  status: CampaignStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  externalId: string | null;

  @Column({ type: 'boolean', default: true })
  simulated: boolean;

  @Column({ type: Date })
  submittedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
