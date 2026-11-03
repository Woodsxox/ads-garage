import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthedRequest, Role } from '../auth-user.js';

const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const { user } = context.switchToHttp().getRequest<AuthedRequest>();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException({ message: 'Insufficient role', code: 'FORBIDDEN' });
    }
    return true;
  }
}

/** Restricts a route to the given roles. Runs after the global JWT guard. */
export const Roles = (...roles: Role[]) => applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(RolesGuard));
