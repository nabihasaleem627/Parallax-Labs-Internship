import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { stripe } from '../config/stripe.js';
import { env } from '../config/env.js';
import { authenticate, requireBillingManager } from '../middleware/auth.js';
import { asyncHandler, HttpError, validate } from '../utils/http.js';
import {
  changePlan,
  createCheckoutSession,
  ensureStripeCustomer,
  getSubscriptionView,
  setCancellation,
} from '../services/billing.js';

const router = Router();
router.use(authenticate);

const planSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'BUSINESS']),
  interval: z.enum(['month', 'year']),
});

router.post('/checkout', requireBillingManager, asyncHandler(async (req, res) => {
  const input = validate(planSchema, req.body);
  const current = await prisma.subscription.findUnique({ where: { tenantId: req.auth!.tenantId } });
  if (current?.stripeSubscriptionId && ['active', 'trialing', 'past_due'].includes(current.status)) {
    throw new HttpError(409, 'You already have a subscription. Use change plan instead.', 'SUBSCRIPTION_EXISTS');
  }

  const url = await createCheckoutSession(req.auth!.tenantId, req.auth!.userId, input.plan, input.interval);
  res.status(201).json({ success: true, data: { url }, message: 'Checkout session created.' });
}));

router.get('/subscription', asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getSubscriptionView(req.auth!.tenantId) });
}));

router.get('/invoices', asyncHandler(async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: req.auth!.tenantId },
    orderBy: { invoiceDate: 'desc' },
    take: 50,
  });
  res.json({
    success: true,
    data: invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      date: invoice.invoiceDate.toISOString(),
      amount: invoice.amountPaid,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      plan: invoice.plan,
      hostedInvoiceUrl: invoice.hostedInvoiceUrl,
      invoicePdf: invoice.invoicePdf,
    })),
  });
}));

router.post('/change-plan', requireBillingManager, asyncHandler(async (req, res) => {
  const input = validate(planSchema, req.body);
  const data = await changePlan(req.auth!.tenantId, input.plan, input.interval);
  res.json({ success: true, data, message: data.message });
}));

router.post('/cancel', requireBillingManager, asyncHandler(async (req, res) => {
  const data = await setCancellation(req.auth!.tenantId, true);
  res.json({ success: true, data, message: data.message });
}));

router.post('/resume', requireBillingManager, asyncHandler(async (req, res) => {
  const data = await setCancellation(req.auth!.tenantId, false);
  res.json({ success: true, data, message: data.message });
}));

router.post('/portal', requireBillingManager, asyncHandler(async (req, res) => {
  const customerId = await ensureStripeCustomer(req.auth!.tenantId, req.auth!.userId);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.FRONTEND_URL}/billing`,
  });
  res.status(201).json({ success: true, data: { url: session.url } });
}));

export default router;
