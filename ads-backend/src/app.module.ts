import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module.js';
import { AuthModule } from './auth/auth.module.js';
import { type AppConfig, loadConfig } from './config/configuration.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { LearningModule } from './learning/learning.module.js';
import { PlansModule } from './plans/plans.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, load: [() => loadConfig()] }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const { ttlMs, limit } = config.get('throttle', { infer: true });
        return {
          throttlers: [{ ttl: ttlMs, limit }],
          // Test suites create many accounts in seconds; rate limiting is covered separately.
          skipIf: () => config.get('nodeEnv', { infer: true }) === 'test',
        };
      },
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    PlansModule,
    ProjectsModule,
    LearningModule,
    IntegrationsModule,
    AiModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
