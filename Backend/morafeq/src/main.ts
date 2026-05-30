/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse cookies
  app.use(cookieParser());

  // Auto validate all incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allow frontend to talk to backend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // All routes start with /api/v1
  app.setGlobalPrefix('api/v1');

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('Morafeq API')
    .setDescription('Airbnb clone API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`API running at http://localhost:${port}/api/v1`);
  console.log(`Docs available at http://localhost:${port}/api/v1/docs`);
}

bootstrap();