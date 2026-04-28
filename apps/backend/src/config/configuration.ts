import { z } from 'zod';

export const configSchema = z.object({
  JWT_SECRET: z.string().min(1),
  HMAC_SECRET: z.string().min(1),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  PORT: z.coerce.number().default(8000),
  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.string().default('http://localhost:5001'),
  CALLBACK_URL: z.string().default('http://localhost:8000/documents/callback'),
  MOCK_VENDOR_URL: z.string().default('http://localhost:8000/verify'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().default('document'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof configSchema>;

export default () => {
  const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    HMAC_SECRET: process.env.HMAC_SECRET,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    CALLBACK_URL: process.env.CALLBACK_URL,
    MOCK_VENDOR_URL: process.env.MOCK_VENDOR_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_BUCKET: process.env.SUPABASE_BUCKET,
    NODE_ENV: process.env.NODE_ENV,
  };

  return configSchema.parse(config);
};
