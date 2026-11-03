import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { EntitlementsService } from './entitlements.service.js';
import { PLAN_CATALOG, PLAN_IDS, type PlanDefinition, type PlanId, type PlanLimits } from './plan-catalog.js';

export interface MyPlanResponse {
  planId: PlanId;
  limits: PlanLimits;
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
}

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly entitlements: EntitlementsService) {}

  /** What each plan allows, as enforced by the server. */
  @Public()
  @Get()
  list(): PlanDefinition[] {
    return PLAN_IDS.map((id) => PLAN_CATALOG[id]);
  }

  /** The caller's current plan and limits. The web app should read entitlements from here, never from local state. */
  @ApiBearerAuth()
  @Get('me')
  async mine(@CurrentUser() user: AuthUser): Promise<MyPlanResponse> {
    const [planId, subscription] = await Promise.all([
      this.entitlements.getPlanId(user.id),
      this.entitlements.getSubscription(user.id),
    ]);
    return {
      planId,
      limits: PLAN_CATALOG[planId].limits,
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
    };
  }
}
