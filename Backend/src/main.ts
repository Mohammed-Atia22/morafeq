/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
  logger:
    process.env.NODE_ENV === 'production'
      ? ['error', 'warn']
      : ['log', 'error', 'warn', 'debug', 'verbose'],
});

  // Parse cookies
  app.use(cookieParser());

 // Trust proxy for rate limiting behind reverse proxy/load balancer
 // Uncomment and configure for production when behind a proxy
 // app.set('trust proxy', 1); // or the number of proxy hops

  // Auto validate all incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

   //Allow frontend to talk to backend
   app.enableCors({
  origin: true,
  credentials: true,
});

// app.enableCors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true,
//   methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// });

  // All routes start with /api/v1
//   app.setGlobalPrefix('api/v1');

  

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('Morafeq API')
    .setDescription('Airbnb clone API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`API running at http://localhost:${port}/api/v1`);
  console.log(`Docs available at http://localhost:${port}/api/v1/docs`);
}

bootstrap();  
//this is my main.ts do your modifications and return the file