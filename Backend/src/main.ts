/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

// Keep a cached instance of the express server instance to optimize cold starts on Vercel
let cachedServer: any;

async function bootstrap() {
  if (cachedServer) {
    return cachedServer;
  }

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
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  // CRITICAL VERCEL CHANGE: Initialize the framework instance instead of calling .listen()
  await app.init();
  
  cachedServer = app.getHttpServer().getInstance();
  return cachedServer;
}

// Local local-development runner guard
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then((server) => {
    const port = process.env.PORT || 3001;
    server.listen(port, () => {
      console.log(`API running at http://localhost:${port}/api/v1`);
      console.log(`Docs available at http://localhost:${port}/api/v1/docs`);
    });
  });
}

// Default export is intercepted by Vercel serverless handlers
export default async (req: any, res: any) => {
  const server = await bootstrap();
  server(req, res);
};