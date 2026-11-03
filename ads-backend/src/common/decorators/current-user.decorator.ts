import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthedRequest, AuthUser } from '../auth-user.js';

/** The authenticated user for the current request. Only valid on non-public routes. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  return context.switchToHttp().getRequest<AuthedRequest>().user;
});
