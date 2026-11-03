import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Patch, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { verifyPassword } from '../common/util/password.js';
import { type PublicUser, toPublicUser } from './user.entity.js';
import { UsersService } from './users.service.js';

export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(80)
  displayName?: string;
}

export class DeleteAccountDto {
  /** Re-entering the password guards against a stolen access token deleting the account. */
  @IsString()
  @MaxLength(128)
  password: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@CurrentUser() auth: AuthUser): Promise<PublicUser> {
    const user = await this.users.findById(auth.id);
    if (!user) throw new NotFoundException('User not found');
    return toPublicUser(user);
  }

  @Patch('me')
  async update(@CurrentUser() auth: AuthUser, @Body() dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.users.updateProfile(auth.id, { displayName: dto.displayName || null });
    if (!user) throw new NotFoundException('User not found');
    return toPublicUser(user);
  }

  /** Deletes the account and, through foreign-key cascades, everything it owns. */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() auth: AuthUser, @Body() dto: DeleteAccountDto): Promise<void> {
    const user = await this.users.findByEmailWithPassword(auth.email);
    if (!user || user.id !== auth.id || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({ message: 'Password is incorrect', code: 'INVALID_CREDENTIALS' });
    }
    await this.users.remove(auth.id);
  }
}
