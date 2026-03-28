import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  MONGODB_URI: z.string().url(),
  CLIENT_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('1h'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().default('12').transform(Number),
});

// Parse and validate process.env
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
