import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static uploads
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });
  
  // Enable CORS
  app.enableCors();

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
