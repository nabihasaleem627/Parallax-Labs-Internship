import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_STARTER_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_STARTER_YEARLY_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_PROFESSIONAL_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_PROFESSIONAL_YEARLY_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_BUSINESS_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_BUSINESS_YEARLY_PRICE_ID: z.string().startsWith('price_'),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
});

const parsed = environmentSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Server environment is not configured correctly.');
}
export const env = parsed.data;
