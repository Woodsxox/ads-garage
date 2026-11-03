import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansModule } from '../plans/plans.module.js';
import { AiController } from './ai.controller.js';
import { AiProvider } from './ai.provider.js';
import { AiService } from './ai.service.js';
import { AiUsage } from './ai-usage.entity.js';
import { MockAiProvider } from './mock-ai.provider.js';

@Module({
  imports: [TypeOrmModule.forFeature([AiUsage]), PlansModule],
  controllers: [AiController],
  providers: [
    AiService,
    // Swap this for a real provider (chosen by config) when one is wired in. Nothing else changes.
    { provide: AiProvider, useClass: MockAiProvider },
  ],
  exports: [AiService],
})
export class AiModule {}
