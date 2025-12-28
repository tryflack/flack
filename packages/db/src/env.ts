import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file before validating
config();

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1, 'TURSO_DATABASE_URL is required'),
  TURSO_AUTH_TOKEN: z.string().min(1, 'TURSO_AUTH_TOKEN is required'),
  LOCAL_DATABASE_URL: z.string().min(1, 'LOCAL_DATABASE_URL is required'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const env = envSchema.parse(process.env);
