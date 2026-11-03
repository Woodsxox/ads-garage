import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { requestId } from './common/middleware/request-id.middleware.js';
import { API_PREFIX, type AppConfig } from './config/configuration.js';

/** Request body ceiling. Designs embed images as data URLs, so this is larger than the default. */
export const BODY_LIMIT = '8mb';

/**
 * Everything that makes the app behave like the real service. Shared by `main.ts` and the e2e
 * tests so tests exercise the same pipes, filters and prefix as production.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);

  if (config.get('trustProxy', { infer: true })) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(requestId);
  // The API returns JSON, so a CSP only matters for the Swagger UI, which needs inline scripts.
  app.use(helmet({ contentSecurityPolicy: !config.get('swaggerEnabled', { infer: true }) }));
  app.enableCors({
    origin: config.get('corsOrigins', { infer: true }),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
  });

  // `rawBody: true` on create() keeps the unparsed bytes on `req.rawBody`, which Stripe signatures need.
  app.useBodyParser('json', { limit: BODY_LIMIT });

  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false, value: false },
    }),
  );
  app.enableShutdownHooks();
}

export function setupSwagger(app: NestExpressApplication): void {
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  if (!config.get('swaggerEnabled', { infer: true })) return;

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Ads Garage API')
      .setDescription('Backend for the Ads Garage web app.')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, document);
}
