import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { runMigrations } from './database/migrate';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Safety Guards
  const nodeEnv = process.env.NODE_ENV || 'development';
  const dbUrl = process.env.DATABASE_URL || '';
  const redisHost = process.env.REDIS_HOST || 'localhost';

  if (nodeEnv === 'development') {
    const isProdDb =
      dbUrl.includes('supabase.com') ||
      dbUrl.includes('aws') ||
      dbUrl.includes('google') ||
      dbUrl.includes('azure');
    const isProdRedis =
      redisHost.includes('upstash.io') ||
      redisHost.includes('redis.cache.windows.net') ||
      redisHost.includes('gcp');

    if (isProdDb) {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        '⚠️ WARNING: You are in DEVELOPMENT mode but connecting to a PRODUCTION-like database!',
      );
      console.warn('\x1b[33m%s\x1b[0m', `Database URL: ${dbUrl}`);
    }

    if (isProdRedis) {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        '⚠️ WARNING: You are in DEVELOPMENT mode but connecting to a PRODUCTION-like Redis!',
      );
      console.warn('\x1b[33m%s\x1b[0m', `Redis Host: ${redisHost}`);
    }
  }

  app.useGlobalPipes(new ZodValidationPipe());

  // Allow requests from frontend
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
