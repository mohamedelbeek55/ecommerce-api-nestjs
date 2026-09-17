import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { Env } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(helmet());

  // Typed access to validated env vars
  const config = app.get(ConfigService<Env, true>);
  const port = config.get('PORT', { infer: true });

  /**
   * Global ValidationPipe:
   *  - whitelist: strips properties not in the DTO
   *  - forbidNonWhitelisted: rejects requests with unknown properties
   *  - transform: auto-transforms payloads to DTO class instances
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // All routes are under /api/v1/...
  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('NestJS e-commerce API with catalog, cart, orders, and Stripe payments')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}/api/v1`);
  console.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
