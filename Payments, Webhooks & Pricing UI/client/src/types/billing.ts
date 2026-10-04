export type PlanId = 'STARTER' | 'PROFESSIONAL' | 'BUSINESS';
export type BillingInterval = 'month' | 'year';
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'none';

export interface Subscription {
  plan: PlanId | 'FREE';
  status: SubscriptionStatus;
  billingInterval: BillingInterval | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  subscriptionStart: string | null;
  cancelAtPeriodEnd: boolean;
  paymentStatus: 'paid' | 'open' | 'failed' | 'pending' | 'none';
  usage: { bookings: number; bookingsLimit: number | null; teamMembers: number; teamLimit: number | null };
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'failed' | 'pending';
  plan: PlanId;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
