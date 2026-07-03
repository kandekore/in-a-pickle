import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDirections, reverseGeocode } from '../services/routing.service.js';

/**
 * Thin server-side proxy over OpenRouteService. The client's LocationService is
 * the only caller — this keeps the ORS key server-side and lets a future React
 * Native app consume the exact same endpoints without modification.
 */
export const locationRouter = Router();

const point = z.tuple([z.number(), z.number()]); // [lng, lat]

const directionsSchema = z.object({ from: point, to: point });

locationRouter.post(
  '/routing/directions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { from, to } = directionsSchema.parse(req.body);
    const route = await getDirections(from, to);
    res.json(route);
  }),
);

const reverseSchema = z.object({ point });

locationRouter.post(
  '/geo/reverse',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { point: coord } = reverseSchema.parse(req.body);
    const label = await reverseGeocode(coord);
    res.json({ label });
  }),
);
