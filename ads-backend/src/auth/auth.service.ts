import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type { AppConfig } from '../config/configuration.js';
import { randomToken, safeEqualHex, sha256Hex } from '../common/util/crypto.js';
import { dummyHash, hashPassword, needsRehash, verifyPassword } from '../common/util/password.js';
import { type PublicUser, toPublicUser, User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import type { LoginDto, RegisterDto } from './dto/auth.dto.js';
import { RefreshToken } from './refresh-token.entity.js';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Access token lifetime in seconds. */
  expiresIn: number;
  user: PublicUser;
}

const INVALID_CREDENTIALS = { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' } as const;
const INVALID_REFRESH = { message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' } as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto): Promise<TokenResponse> {
    const user = await this.users.create({
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      displayName: dto.displayName || null,
    });
    return (await this.issue(user)).response;
  }

  async login(dto: LoginDto): Promise<TokenResponse> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user) {
      // Spend the same time as a real check so response timing does not reveal which emails exist.
      await verifyPassword(dto.password, await dummyHash());
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (needsRehash(user.passwordHash)) {
      await this.users.updatePasswordHash(user.id, await hashPassword(dto.password));
    }
    return (await this.issue(user)).response;
  }

  /**
   * Rotates a refresh token. Presenting one that was already used means it was probably copied,
   * so every session for that user is revoked and they must sign in again.
   */
  async refresh(presented: string): Promise<TokenResponse> {
    const parsed = this.parseRefreshToken(presented);
    if (!parsed) throw new UnauthorizedException(INVALID_REFRESH);

    const row = await this.refreshTokens.findOneBy({ id: parsed.id });
    if (!row || !safeEqualHex(row.tokenHash, sha256Hex(parsed.secret))) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    if (row.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException(INVALID_REFRESH);

    // Atomic claim: only one concurrent request can flip revokedAt from null.
    const claimed = await this.refreshTokens.update({ id: row.id, revokedAt: IsNull() }, { revokedAt: new Date() });
    if (claimed.affected !== 1) {
      await this.revokeAllForUser(row.userId);
      throw new UnauthorizedException({ message: 'Refresh token was already used', code: 'REFRESH_TOKEN_REUSED' });
    }

    const user = await this.users.findById(row.userId);
    if (!user) throw new UnauthorizedException(INVALID_REFRESH);
    const next = await this.issue(user);
    await this.refreshTokens.update({ id: row.id }, { replacedById: next.refreshTokenId });
    return next.response;
  }

  async logout(presented: string): Promise<void> {
    const parsed = this.parseRefreshToken(presented);
    if (!parsed) return;
    const row = await this.refreshTokens.findOneBy({ id: parsed.id });
    if (row && safeEqualHex(row.tokenHash, sha256Hex(parsed.secret))) {
      await this.refreshTokens.update({ id: row.id, revokedAt: IsNull() }, { revokedAt: new Date() });
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokens.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  /** Deletes expired and long-revoked rows. Call it from a scheduled job. */
  async purgeExpired(now = new Date()): Promise<number> {
    const result = await this.refreshTokens
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now })
      .execute();
    return result.affected ?? 0;
  }

  /** Signs an access token and stores a fresh refresh token. `refreshTokenId` is for rotation bookkeeping only. */
  private async issue(user: User): Promise<{ response: TokenResponse; refreshTokenId: string }> {
    const jwtConfig = this.config.get('jwt', { infer: true });

    const accessToken = await this.jwt.signAsync(
      { email: user.email, role: user.role },
      { subject: user.id, expiresIn: jwtConfig.accessTtlSec },
    );

    const secret = randomToken(32);
    const row = await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash: sha256Hex(secret),
        expiresAt: new Date(Date.now() + jwtConfig.refreshTtlSec * 1000),
        revokedAt: null,
        replacedById: null,
      }),
    );

    return {
      refreshTokenId: row.id,
      response: {
        accessToken,
        refreshToken: `${row.id}.${secret}`,
        tokenType: 'Bearer',
        expiresIn: jwtConfig.accessTtlSec,
        user: toPublicUser(user),
      },
    };
  }

  private parseRefreshToken(value: string): { id: string; secret: string } | null {
    const dot = value.indexOf('.');
    if (dot < 1 || dot === value.length - 1) return null;
    return { id: value.slice(0, dot), secret: value.slice(dot + 1) };
  }
}
