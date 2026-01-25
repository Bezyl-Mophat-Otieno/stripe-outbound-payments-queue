import '@/envConfig';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_API_VERSION: z.string().min(1),
  BASE_URL: z.string().min(1),
  STRIPE_BASE_URL: z.string().min(1),
  STRIPE_FINANCIAL_ACCOUNTID: z.string().min(1),
  STRIPE_BATCH_SIZE: z.string().min(1),
  MAX_TRANSIENT_ERROR_RETRIES: z.string().min(1),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_API_VERSION: process.env.STRIPE_API_VERSION,
  BASE_URL: process.env.BASE_URL,
  STRIPE_BASE_URL: process.env.STRIPE_BASE_URL,
  STRIPE_FINANCIAL_ACCOUNTID: process.env.STRIPE_FINANCIAL_ACCOUNTID,
  STRIPE_BATCH_SIZE: process.env.STRIPE_BATCH_SIZE,
  MAX_TRANSIENT_ERROR_RETRIES: process.env.MAX_TRANSIENT_ERROR_RETRIES,
});
