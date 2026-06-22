import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

let cachedServer: any;

async function bootstrapServer() {
  if (!cachedServer) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    const app = await NestFactory.create(AppModule, adapter);

    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');

    await app.init();

    cachedServer = serverlessExpress({ app: expressApp });
  }

  return cachedServer;
}

export default async (req: any, res: any) => {
  const server = await bootstrapServer();
  return server(req, res);
};