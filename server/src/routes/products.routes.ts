import { Router } from 'express';
import { catalogue } from '../data/catalogue.js';
import { quoteJob } from '../services/pricing.service.js';

export const productsRouter = Router();

/** Public catalogue + live quote for each service (fixed-price engine). */
productsRouter.get('/products', (_req, res) => {
  res.json({
    items: catalogue.map((item) => ({
      ...item,
      quote: quoteJob(item.serviceType),
    })),
  });
});
