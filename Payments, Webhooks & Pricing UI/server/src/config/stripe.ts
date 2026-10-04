import Stripe from 'stripe';
import { env } from './env.js';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, { appInfo: { name: 'BookFlow', version: '3.0.0' } });
export type PaidPlan = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';
export type Interval = 'month' | 'year';

export const stripePrices: Record<PaidPlan, Record<Interval, string>> = {
  STARTER: { month: env.STRIPE_STARTER_PRICE_ID, year: env.STRIPE_STARTER_YEARLY_PRICE_ID },
  PROFESSIONAL: { month: env.STRIPE_PROFESSIONAL_PRICE_ID, year: env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID },
  BUSINESS: { month: env.STRIPE_BUSINESS_PRICE_ID, year: env.STRIPE_BUSINESS_YEARLY_PRICE_ID },
};

export function planForPrice(priceId: string): { plan: PaidPlan; interval: Interval } | null {
  for (const [plan, intervals] of Object.entries(stripePrices)) {
    for (const [interval, configuredPriceId] of Object.entries(intervals)) {
      if (configuredPriceId === priceId) return { plan: plan as PaidPlan, interval: interval as Interval };
    }
  }
  return null;
}
