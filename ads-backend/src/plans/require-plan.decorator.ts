import { applyDecorators, CanActivate, ExecutionContext, Injectable, SetMetadata, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthedRequest } from '../common/auth-user.js';
import { EntitlementsService } from './entitlements.service.js';
import type { PlanId } from './plan-catalog.js';

const REQUIRED_PLAN_KEY = 'requiredPlan';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PlanId | undefined>(REQUIRED_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const { user } = context.switchToHttp().getRequest<AuthedRequest>();
    await this.entitlements.assertPlan(user.id, required);
    return true;
  }
}

/**
 * Requires the caller's plan to be `plan` or higher, checked against the database on every call.
 * The module that owns the controller must import `PlansModule` so the guard can resolve.
 */
export const RequirePlan = (plan: PlanId) =>
  applyDecorators(SetMetadata(REQUIRED_PLAN_KEY, plan), UseGuards(PlanGuard));
