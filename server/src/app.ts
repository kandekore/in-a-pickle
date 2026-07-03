import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { jobsRouter } from './routes/jobs.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { providerRouter } from './routes/provider.routes.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Health at root; everything else under /api.
  app.use('/', healthRouter);
  app.use('/api', authRouter);
  app.use('/api', productsRouter);
  app.use('/api', jobsRouter);
  app.use('/api', adminRouter);
  app.use('/api', providerRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
