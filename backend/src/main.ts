import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Security headers
  app.use(helmet());
  
  // CORS - restricted in production
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];
  const isProduction = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: isProduction && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });
  
  // Serve static uploads only in development
  if (!isProduction) {
    app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
      prefix: '/uploads',
    });
  }
  
  // Set global prefix
  app.setGlobalPrefix('api/v1');

  // Use global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Fail fast if JWT secrets missing in production
  if (isProduction) {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in production');
    }
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
