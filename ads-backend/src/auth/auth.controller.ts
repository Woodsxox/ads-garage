import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthService, type TokenResponse } from './auth.service.js';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto.js';

/** Credential endpoints get a much tighter rate limit than the rest of the API. */
const STRICT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(STRICT)
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<TokenResponse> {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle(STRICT)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<TokenResponse> {
    return this.auth.login(dto);
  }

  /** Exchanges a refresh token for a new pair. The old refresh token stops working. */
  @Public()
  @Throttle(STRICT)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto): Promise<TokenResponse> {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }
}
