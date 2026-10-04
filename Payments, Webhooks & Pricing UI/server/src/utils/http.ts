import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public code = 'REQUEST_FAILED') { super(message); }
}
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };
export const validate = <T>(schema: ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);
  if (!result.success) throw result.error;
  return result.data;
};
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Please check the submitted information.', details: error.flatten().fieldErrors } });
  if (error instanceof HttpError) return res.status(error.status).json({ success: false, error: { code: error.code, message: error.message } });
  if (typeof error === 'object' && error !== null && 'type' in error && String((error as { type: unknown }).type).startsWith('Stripe')) {
    console.error('Stripe request failed:', (error as { type: unknown }).type);
    return res.status(502).json({ success: false, error: { code: 'BILLING_PROVIDER_UNAVAILABLE', message: 'Billing is temporarily unavailable. Please try again shortly.' } });
  }
  console.error(error);
  return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again later.' } });
}
