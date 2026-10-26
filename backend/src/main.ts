import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
    .split(',').map((value) => value.trim()).filter(Boolean);
  app.enableCors({ origin: origins });
  await app.listen(Number(process.env.PORT) || 4000, '0.0.0.0');
}

void bootstrap();
