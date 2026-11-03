import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningController } from './learning.controller.js';
import { LessonProgress, UserBadge } from './learning.entities.js';
import { LearningService } from './learning.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([LessonProgress, UserBadge])],
  controllers: [LearningController],
  providers: [LearningService],
})
export class LearningModule {}
