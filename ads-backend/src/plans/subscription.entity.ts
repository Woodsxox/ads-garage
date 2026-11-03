import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity.js';
import type { PlanId } from './plan-catalog.js';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'paused';

/**
 * Statuses that keep paid access. `past_due` is a deliberate grace period: the payment provider
 * keeps retrying for days, and cutting a customer off on the first failed card is harsh. When the
 * retries run out the provider moves the subscription to `canceled` or `unpaid` and access ends.
 */
export const ENTITLED_STATUSES: readonly SubscriptionStatus[] = ['active', 'trialing', 'past_due'];

/** One row per user. The payment provider's webhooks are the only thing that writes it. */
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 16 })
  planId: PlanId;

  @Column({ type: 'varchar', length: 16 })
  status: SubscriptionStatus;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  providerCustomerId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  providerSubscriptionId: string | null;

  @Column({ type: Date, nullable: true })
  currentPeriodEnd: Date | null;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  /** When the provider says the last applied change happened. Older events are ignored. */
  @Column({ type: Date, nullable: true })
  lastEventAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
