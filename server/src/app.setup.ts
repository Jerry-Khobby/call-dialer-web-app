import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';
import { CorsIoAdapter } from './common/cors-io.adapter';
import { MongooseExceptionFilter } from './common/mongoose-exception.filter';
import { Env } from './config/env.validation';

/** Shared by main.ts and the e2e tests so both run the app with the same middleware. */
export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const origins = config
    .get('CLIENT_ORIGIN', { infer: true })
    .split(',')
    .map((origin) => origin.trim());

  // Behind a host's proxy, take the visitor's IP from X-Forwarded-For (rate limits, logs).
  const express = app.getHttpAdapter().getInstance() as {
    set(setting: string, value: unknown): void;
  };
  express.set('trust proxy', config.get('TRUST_PROXY', { infer: true }));

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(compression());
  app.enableCors({ origin: origins });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new MongooseExceptionFilter());
  app.useWebSocketAdapter(new CorsIoAdapter(app, origins));
  app.enableShutdownHooks();
}
