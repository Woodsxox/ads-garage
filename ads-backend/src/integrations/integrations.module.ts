import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansModule } from '../plans/plans.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { IntegrationsController } from './integrations.controller.js';
import { Campaign, ConnectedAccount } from './integrations.entities.js';
import { IntegrationsService } from './integrations.service.js';
import { MockPlatformConnector } from './mock-platform.connector.js';
import { PlatformConnector } from './platform-connector.js';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectedAccount, Campaign]), PlansModule, ProjectsModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    // Replace with per-platform connectors (Google Ads first) once API access and OAuth are in place.
    { provide: PlatformConnector, useClass: MockPlatformConnector },
  ],
})
export class IntegrationsModule {}
