import { Router, raw } from 'express';
import type Stripe from 'stripe';
import { prisma } from '../config/prisma.js';
import { stripe } from '../config/stripe.js';
import { env } from '../config/env.js';
import { isUniqueConstraint, processStripeEvent } from '../services/billing.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
const PROCESSING_LOCK_MS = 5 * 60 * 1000;

router.post('/stripe', raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).json({ success: false, error: { code: 'MISSING_SIGNATURE', message: 'Stripe signature is required.' } });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    console.warn('Stripe webhook signature verification failed.');
    return res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed.' } });
  }

  try {
    await prisma.webhookEvent.create({ data: { stripeEventId: event.id, eventType: event.type } });
  } catch (error) {
    if (!isUniqueConstraint(error)) throw error;

    const existing = await prisma.webhookEvent.findUnique({ where: { stripeEventId: event.id } });
    const currentlyProcessing = existing?.status === 'RECEIVED' && Date.now() - existing.updatedAt.getTime() < PROCESSING_LOCK_MS;
    if (existing?.status === 'PROCESSED' || currentlyProcessing) {
      return res.status(200).json({ success: true, data: { received: true, duplicate: true } });
    }

    // A failed or stale event can be safely retried by Stripe.
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { status: 'RECEIVED', errorMessage: null, processedAt: null },
    });
  }

  try {
    const tenantId = await processStripeEvent(event);
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { status: 'PROCESSED', processedAt: new Date(), tenantId },
    });
    return res.status(200).json({ success: true, data: { received: true } });
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed`, error);
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message.slice(0, 500) : 'Unknown processing error' },
    });
    return res.status(500).json({ success: false, error: { code: 'WEBHOOK_PROCESSING_FAILED', message: 'Webhook could not be processed.' } });
  }
}));

export default router;
