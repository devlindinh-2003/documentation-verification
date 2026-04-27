import { z } from 'zod';

export const configSchema = z.object({
  JWT_SECRET: z.string().min(1),
  HMAC_SECRET: z.string().min(1),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_BUCKET: z.string().min(1),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type Config = z.infer<typeof configSchema>;

export default () => {
  const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    HMAC_SECRET: process.env.HMAC_SECRET,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    PORT: process.env.PORT,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_BUCKET: process.env.SUPABASE_BUCKET,
    NODE_ENV: process.env.NODE_ENV,
  };

  return configSchema.parse(config);
};
