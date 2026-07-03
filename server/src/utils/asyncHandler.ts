import type { NextFunction, Request, Response } from 'express';

/** Wrap async route handlers so thrown/rejected errors reach the error middleware. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/** Lightweight typed HTTP error. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
