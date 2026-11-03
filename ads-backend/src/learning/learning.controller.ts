import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { SubmitLessonDto, UpdateProgressDto } from './dto/learning.dto.js';
import { type BadgeView, type LessonSummary, LearningService, type SubmitResult } from './learning.service.js';

@ApiTags('learning')
@ApiBearerAuth()
@Controller('learning')
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  /** Every lesson with the caller's progress. Answer keys are never sent. */
  @Get('lessons')
  lessons(@CurrentUser() user: AuthUser): Promise<LessonSummary[]> {
    return this.learning.listLessons(user.id);
  }

  @Put('lessons/:slug/progress')
  progress(@CurrentUser() user: AuthUser, @Param('slug') slug: string, @Body() dto: UpdateProgressDto) {
    return this.learning.recordStep(user.id, slug, dto.step);
  }

  /** Submit exercise answers for grading. Passing completes the lesson and earns its badge. */
  @HttpCode(HttpStatus.OK)
  @Post('lessons/:slug/submit')
  submit(@CurrentUser() user: AuthUser, @Param('slug') slug: string, @Body() dto: SubmitLessonDto): Promise<SubmitResult> {
    return this.learning.submit(user.id, slug, dto.answers);
  }

  @Get('badges')
  badges(@CurrentUser() user: AuthUser): Promise<BadgeView[]> {
    return this.learning.listBadges(user.id);
  }
}
