import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PLAN_CATALOG, type PlanId, type PlanLimits, planAtLeast } from './plan-catalog.js';
import { ENTITLED_STATUSES, Subscription, type SubscriptionStatus } from './subscription.entity.js';

export interface SubscriptionUpdate {
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  customerId: string | null;
  subscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  /** When the provider says this happened. */
  occurredAt: Date;
}

/** Answers "what may this user do?" in one place. Controllers and guards ask here, never the client. */
@Injectable()
export class EntitlementsService {
  constructor(@InjectRepository(Subscription) private readonly subscriptions: Repository<Subscription>) {}

  getSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptions.findOneBy({ userId });
  }

  findBySubscriptionId(providerSubscriptionId: string): Promise<Subscription | null> {
    return this.subscriptions.findOneBy({ providerSubscriptionId });
  }

  /** The plan the user is entitled to right now. No subscription, or a lapsed one, means Starter. */
  async getPlanId(userId: string): Promise<PlanId> {
    const subscription = await this.getSubscription(userId);
    if (!subscription || !ENTITLED_STATUSES.includes(subscription.status)) return 'starter';
    return subscription.planId;
  }

  async getLimits(userId: string): Promise<PlanLimits> {
    return PLAN_CATALOG[await this.getPlanId(userId)].limits;
  }

  async assertPlan(userId: string, required: PlanId): Promise<PlanId> {
    const current = await this.getPlanId(userId);
    if (!planAtLeast(current, required)) {
      throw new ForbiddenException({
        message: `This needs the ${PLAN_CATALOG[required].name} plan or higher`,
        code: 'PLAN_REQUIRED',
        details: { required, current },
      });
    }
    return current;
  }

  /**
   * Applies a subscription change from the payment provider. Returns false when the change is
   * older than what is already stored, since providers do not guarantee webhook order.
   */
  async applySubscription(update: SubscriptionUpdate): Promise<boolean> {
    const existing = await this.getSubscription(update.userId);
    if (existing?.lastEventAt && update.occurredAt.getTime() < existing.lastEventAt.getTime()) return false;

    const values = {
      planId: update.planId,
      status: update.status,
      providerCustomerId: update.customerId,
      providerSubscriptionId: update.subscriptionId,
      currentPeriodEnd: update.currentPeriodEnd,
      cancelAtPeriodEnd: update.cancelAtPeriodEnd,
      lastEventAt: update.occurredAt,
    };

    if (existing) {
      await this.subscriptions.update({ id: existing.id }, values);
    } else {
      await this.subscriptions.save(this.subscriptions.create({ userId: update.userId, ...values }));
    }
    return true;
  }
}
