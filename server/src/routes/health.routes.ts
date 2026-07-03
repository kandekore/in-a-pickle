import { Router } from 'express';
import { isDbConnected } from '../db/connect.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'in-a-pickle-api',
    db: isDbConnected() ? 'connected' : 'degraded',
    time: new Date().toISOString(),
  });
});
