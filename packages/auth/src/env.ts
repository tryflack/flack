import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file before validating
config();

const envSchema = z.object({
  BETTER_AUTH_URL: z.url().default('http://localhost:3001'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(1, 'BETTER_AUTH_SECRET is required'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const env = envSchema.parse(process.env);
