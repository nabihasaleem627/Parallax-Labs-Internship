import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, HttpError, validate } from '../utils/http.js';

const router = Router();
router.use(authenticate);
const bookingSchema = z.object({ customerId: z.string().cuid(), service: z.string().min(2).max(120), startsAt: z.string().datetime(), endsAt: z.string().datetime(), amount: z.number().int().nonnegative().default(0), notes: z.string().max(1000).optional() });
router.get('/', asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({ where: { tenantId: req.auth!.tenantId }, include: { customer: { select: { id: true, name: true, email: true } } }, orderBy: { startsAt: 'asc' }, take: 100 });
  res.json({ success: true, data: bookings });
}));
router.post('/', asyncHandler(async (req, res) => {
  const input = validate(bookingSchema, req.body);
  if (new Date(input.endsAt) <= new Date(input.startsAt)) throw new HttpError(422, 'End time must be after start time.', 'INVALID_TIME_RANGE');
  const customer = await prisma.customer.findFirst({ where: { id: input.customerId, tenantId: req.auth!.tenantId } });
  if (!customer) throw new HttpError(404, 'Customer not found.', 'CUSTOMER_NOT_FOUND');
  const booking = await prisma.booking.create({ data: { ...input, startsAt: new Date(input.startsAt), endsAt: new Date(input.endsAt), tenantId: req.auth!.tenantId } });
  res.status(201).json({ success: true, data: booking, message: 'Booking created successfully.' });
}));
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = validate(z.object({ status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']) }), req.body);
  const bookingId = typeof req.params.id === 'string' ? req.params.id : req.params.id?.[0];
  if (!bookingId) throw new HttpError(400, 'A booking ID is required.', 'BOOKING_ID_REQUIRED');
  const existing = await prisma.booking.findFirst({ where: { id: bookingId, tenantId: req.auth!.tenantId } });
  if (!existing) throw new HttpError(404, 'Booking not found.', 'BOOKING_NOT_FOUND');
  const booking = await prisma.booking.update({ where: { id: existing.id }, data: { status } });
  res.json({ success: true, data: booking, message: 'Booking updated.' });
}));
export default router;
