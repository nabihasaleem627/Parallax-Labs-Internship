import type { Invoice, Subscription } from '../types/billing';

export const defaultSubscription: Subscription = {
  plan: 'PROFESSIONAL',
  status: 'active',
  billingInterval: 'month',
  currentPeriodStart: '2026-09-18T00:00:00.000Z',
  currentPeriodEnd: '2026-10-18T00:00:00.000Z',
  subscriptionStart: '2026-04-18T00:00:00.000Z',
  cancelAtPeriodEnd: false,
  paymentStatus: 'paid',
  usage: { bookings: 742, bookingsLimit: 1000, teamMembers: 4, teamLimit: 5 },
};

export const demoInvoices: Invoice[] = [
  { id: 'in_1048', number: 'BF-2026-01048', date: '2026-09-18T00:00:00.000Z', amount: 2900, currency: 'USD', status: 'paid', plan: 'PROFESSIONAL', hostedInvoiceUrl: '#', invoicePdf: '#' },
  { id: 'in_0981', number: 'BF-2026-00981', date: '2026-08-18T00:00:00.000Z', amount: 2900, currency: 'USD', status: 'paid', plan: 'PROFESSIONAL', hostedInvoiceUrl: '#', invoicePdf: '#' },
  { id: 'in_0914', number: 'BF-2026-00914', date: '2026-07-18T00:00:00.000Z', amount: 2900, currency: 'USD', status: 'paid', plan: 'PROFESSIONAL', hostedInvoiceUrl: '#', invoicePdf: '#' },
  { id: 'in_0847', number: 'BF-2026-00847', date: '2026-06-18T00:00:00.000Z', amount: 2900, currency: 'USD', status: 'paid', plan: 'PROFESSIONAL', hostedInvoiceUrl: '#', invoicePdf: '#' },
];
