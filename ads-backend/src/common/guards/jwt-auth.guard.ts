import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { AuthedRequest, Role } from '../auth-user.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

/**
 * Global guard: every route needs a valid access token unless it is marked `@Public()`.
 * It verifies the signature and expiry only. It does not hit the database, so a deleted user's
 * token stays valid until it expires (15 minutes by default). Refresh tokens are the revocable part.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException({ message: 'Missing bearer token', code: 'UNAUTHENTICATED' });
    }

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('no subject');
      request.user = { id: payload.sub, email: payload.email, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException({ message: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }
  }
}
