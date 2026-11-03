import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp, setupSwagger } from './bootstrap.js';
import { API_PREFIX, type AppConfig } from './config/configuration.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  configureApp(app);
  setupSwagger(app);

  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const port = config.get('port', { infer: true });
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Ads Garage API listening on http://localhost:${port}/${API_PREFIX}`);
  if (config.get('swaggerEnabled', { infer: true })) logger.log(`API docs at http://localhost:${port}/docs`);
}

await bootstrap();
