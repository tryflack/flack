import { config } from "dotenv";
import { z } from "zod";

// Load .env file before validating
config();

const envSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  FROM_ADDRESS: z.string().email("FROM_ADDRESS must be a valid email address"),
});

export const env = envSchema.parse(process.env);
