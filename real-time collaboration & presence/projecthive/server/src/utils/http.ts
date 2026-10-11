import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';

export function parseBody<S extends ZodTypeAny>(schema: S, req: Request, res: Response): z.infer<S> | null {
  try {
    return schema.parse(req.body) as z.infer<S>;
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
      });
      return null;
    }
    throw err;
  }
}

/** Typed access to route params for mergeParams routers mounted under /:projectId. */
export function prm(req: { params: unknown }, key: string): string {
  return (req.params as Record<string, string>)[key] ?? '';
}


export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[projecthive] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

export const asyncRoute =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
