import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  logger.error('Unhandled error', { error: (err as Error)?.message, stack: (err as Error)?.stack });
  res.status(500).json({ error: 'Internal server error' });
}
