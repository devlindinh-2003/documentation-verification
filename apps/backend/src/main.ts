import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { runMigrations } from './database/migrate';

async function bootstrap() {
  // Run pending migrations before starting the server
  // await runMigrations();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe());

  // Allow requests from frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5001',
    credentials: true,
  });

  // Restart server after changing env
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
