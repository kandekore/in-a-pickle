import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../models/User.js';
import { HttpError } from '../utils/asyncHandler.js';

export interface AuthPayload {
  sub: string; // user id
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

/** Verify the bearer access token and attach `req.auth`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing bearer token'));
  }
  try {
    const decoded = jwt.verify(header.slice(7), env.jwt.accessSecret) as AuthPayload;
    req.auth = { sub: decoded.sub, role: decoded.role };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

/** RBAC guard — use after requireAuth. Every protected endpoint enforces this. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new HttpError(401, 'Not authenticated'));
    if (!roles.includes(req.auth.role)) {
      return next(new HttpError(403, 'Insufficient permissions'));
    }
    next();
  };
}
