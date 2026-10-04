import type Stripe from 'stripe';
import { type Plan, type PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { planForPrice, stripe, stripePrices, type Interval, type PaidPlan } from '../config/stripe.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

export async function ensureStripeCustomer(tenantId: string, userId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { memberships: { where: { userId }, include: { user: true }, take: 1 } } });
  if (!tenant) throw new HttpError(404, 'Workspace not found.', 'TENANT_NOT_FOUND');
  if (tenant.stripeCustomerId) return tenant.stripeCustomerId;
  const user = tenant.memberships[0]?.user;
  const customer = await stripe.customers.create({ name: tenant.name, email: user?.email, metadata: { tenantId } }, { idempotencyKey: `bookflow-customer-${tenantId}` });
  await prisma.tenant.update({ where: { id: tenantId }, data: { stripeCustomerId: customer.id } });
  await prisma.subscription.upsert({ where: { tenantId }, create: { tenantId, stripeCustomerId: customer.id }, update: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSession(tenantId: string, userId: string, plan: PaidPlan, interval: Interval) {
  const customerId = await ensureStripeCustomer(tenantId, userId);
  const priceId = stripePrices[plan][interval];
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', customer: customerId, line_items: [{ price: priceId, quantity: 1 }], allow_promotion_codes: true,
    client_reference_id: tenantId,
    metadata: { tenantId, userId, plan, interval },
    subscription_data: { metadata: { tenantId, plan, interval } },
    success_url: `${env.FRONTEND_URL}/checkout/success?plan=${plan.toLowerCase()}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/checkout/cancel`,
  }, { idempotencyKey: `checkout-${tenantId}-${plan}-${interval}-${Math.floor(Date.now() / 30000)}` });
  if (!session.url) throw new HttpError(502, 'Stripe did not return a checkout URL.', 'STRIPE_CHECKOUT_FAILED');
  return session.url;
}

export async function getSubscriptionView(tenantId: string) {
  const [subscription, bookingCount, teamCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { tenantId } }),
    prisma.booking.count({ where: { tenantId, startsAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.membership.count({ where: { tenantId } }),
  ]);
  const plan = subscription?.plan ?? 'FREE';
  const limits: Record<Plan, { bookings: number | null; team: number | null }> = {
    FREE: { bookings: 25, team: 1 }, STARTER: { bookings: 100, team: 1 }, PROFESSIONAL: { bookings: 1000, team: 5 }, BUSINESS: { bookings: null, team: null },
  };
  return {
    plan, status: subscription?.status ?? 'none', billingInterval: subscription?.billingInterval?.toLowerCase() ?? null,
    currentPeriodStart: subscription?.currentPeriodStart?.toISOString() ?? null, currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
    subscriptionStart: subscription?.subscriptionStart?.toISOString() ?? null, cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    paymentStatus: subscription?.paymentStatus.toLowerCase() ?? 'none', usage: { bookings: bookingCount, bookingsLimit: limits[plan].bookings, teamMembers: teamCount, teamLimit: limits[plan].team },
  };
}

export async function changePlan(tenantId: string, plan: PaidPlan, interval: Interval) {
  const local = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!local?.stripeSubscriptionId) throw new HttpError(404, 'No active Stripe subscription was found.', 'SUBSCRIPTION_NOT_FOUND');
  const subscription = await stripe.subscriptions.retrieve(local.stripeSubscriptionId);
  const item = subscription.items.data[0];
  if (!item) throw new HttpError(409, 'The subscription has no billable item.', 'SUBSCRIPTION_ITEM_MISSING');
  await stripe.subscriptions.update(subscription.id, { items: [{ id: item.id, price: stripePrices[plan][interval] }], proration_behavior: 'create_prorations', metadata: { tenantId, plan, interval } });
  return { message: 'Plan change submitted. Your account will update after Stripe confirms it.' };
}
export async function setCancellation(tenantId: string, cancelAtPeriodEnd: boolean) {
  const local = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!local?.stripeSubscriptionId) throw new HttpError(404, 'No subscription was found.', 'SUBSCRIPTION_NOT_FOUND');
  await stripe.subscriptions.update(local.stripeSubscriptionId, { cancel_at_period_end: cancelAtPeriodEnd });
  return { message: cancelAtPeriodEnd ? 'Your subscription will be cancelled at the end of the billing period.' : 'Your subscription will renew as usual.' };
}

function unixDate(value: number | null | undefined) { return value ? new Date(value * 1000) : null; }
export async function syncStripeSubscription(stripeSubscription: Stripe.Subscription, fallbackTenantId?: string) {
  const raw = stripeSubscription as unknown as Record<string, any>;
  const customerId = typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : stripeSubscription.customer.id;
  const existing = await prisma.subscription.findFirst({ where: { OR: [{ stripeSubscriptionId: stripeSubscription.id }, { stripeCustomerId: customerId }] } });
  const tenant = await prisma.tenant.findFirst({ where: { stripeCustomerId: customerId } });
  const tenantId = stripeSubscription.metadata.tenantId || fallbackTenantId || existing?.tenantId || tenant?.id;
  if (!tenantId) throw new Error(`Could not resolve tenant for subscription ${stripeSubscription.id}`);
  const priceId = stripeSubscription.items.data[0]?.price.id;
  if (!priceId) throw new Error(`Subscription ${stripeSubscription.id} has no price`);
  const mapping = planForPrice(priceId);
  if (!mapping) throw new Error(`Stripe price ${priceId} is not configured in BookFlow`);
  const status = stripeSubscription.status;
  const paymentStatus: PaymentStatus = status === 'active' || status === 'trialing' ? 'PAID' : status === 'past_due' || status === 'unpaid' ? 'FAILED' : 'PENDING';
  await prisma.$transaction([
    prisma.tenant.update({ where: { id: tenantId }, data: { stripeCustomerId: customerId } }),
    prisma.subscription.upsert({ where: { tenantId }, create: { tenantId, stripeCustomerId: customerId, stripeSubscriptionId: stripeSubscription.id, stripePriceId: priceId, plan: mapping.plan, status, billingInterval: mapping.interval.toUpperCase() as 'MONTH'|'YEAR', currentPeriodStart: unixDate(raw.current_period_start), currentPeriodEnd: unixDate(raw.current_period_end), subscriptionStart: unixDate(raw.start_date), cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end, paymentStatus }, update: { stripeCustomerId: customerId, stripeSubscriptionId: stripeSubscription.id, stripePriceId: priceId, plan: mapping.plan, status, billingInterval: mapping.interval.toUpperCase() as 'MONTH'|'YEAR', currentPeriodStart: unixDate(raw.current_period_start), currentPeriodEnd: unixDate(raw.current_period_end), subscriptionStart: unixDate(raw.start_date), cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end, paymentStatus } }),
  ]);
  return tenantId;
}

function normalizedInvoiceStatus(invoice: Stripe.Invoice, eventType: string) {
  if (eventType === 'invoice.payment_failed') return 'failed';
  if (eventType === 'invoice.paid') return 'paid';
  if (invoice.status === 'open') return 'open';
  if (invoice.status === 'paid') return 'paid';
  if (invoice.status === 'uncollectible' || invoice.status === 'void') return 'failed';
  return 'pending';
}
export async function syncInvoice(invoice: Stripe.Invoice, eventType: string) {
  const raw = invoice as unknown as Record<string, any>;
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  const subscriptionId = typeof raw.subscription === 'string' ? raw.subscription : raw.subscription?.id || raw.parent?.subscription_details?.subscription;
  const local = await prisma.subscription.findFirst({ where: { OR: [...(subscriptionId ? [{ stripeSubscriptionId: subscriptionId }] : []), ...(customerId ? [{ stripeCustomerId: customerId }] : [])] } });
  if (!local) throw new Error(`Could not resolve tenant for invoice ${invoice.id}`);
  const linePriceId = raw.lines?.data?.[0]?.pricing?.price_details?.price || raw.lines?.data?.[0]?.price?.id || local.stripePriceId;
  const mapping = linePriceId ? planForPrice(linePriceId) : null;
  const status = normalizedInvoiceStatus(invoice, eventType);
  await prisma.$transaction([
    prisma.invoice.upsert({ where: { stripeInvoiceId: invoice.id }, create: { tenantId: local.tenantId, stripeInvoiceId: invoice.id, stripeSubscriptionId: subscriptionId, number: invoice.number || invoice.id, amountPaid: status === 'paid' ? invoice.amount_paid : invoice.amount_due, currency: invoice.currency, status, plan: (mapping?.plan || local.plan) as Plan, hostedInvoiceUrl: invoice.hosted_invoice_url, invoicePdf: invoice.invoice_pdf, invoiceDate: unixDate(invoice.created)! }, update: { amountPaid: status === 'paid' ? invoice.amount_paid : invoice.amount_due, status, hostedInvoiceUrl: invoice.hosted_invoice_url, invoicePdf: invoice.invoice_pdf } }),
    prisma.subscription.update({ where: { tenantId: local.tenantId }, data: { paymentStatus: status.toUpperCase() as PaymentStatus } }),
  ]);
  return local.tenantId;
}

export async function processStripeEvent(event: Stripe.Event): Promise<string | undefined> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.subscription !== 'string') return session.metadata?.tenantId;
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      return syncStripeSubscription(subscription, session.metadata?.tenantId);
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return syncStripeSubscription(event.data.object as Stripe.Subscription);
    case 'invoice.paid':
    case 'invoice.payment_failed':
      return syncInvoice(event.data.object as Stripe.Invoice, event.type);
    default:
      return undefined;
  }
}

export function isUniqueConstraint(error: unknown) { return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'; }
