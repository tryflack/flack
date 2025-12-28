import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  // Local SQLite URL for Prisma CLI migrations (required when using Turso)
  LOCAL_DATABASE_URL: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
