import { Router, type Request } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDirections, reverseGeocode, autocompleteAddress } from '../services/routing.service.js';
import { ipGeolocate } from '../services/ipgeo.service.js';

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

// ── Public geocoding for the request form ──────────────────────────────────
// These two are intentionally UNauthenticated: the request form is usable
// before login, so type-ahead and IP pre-fill must work for anonymous users.
// The ORS key still never leaves the server.

const autocompleteQuery = z.object({
  text: z.string().min(3).max(120),
  lat: z.coerce.number().optional(),
  lon: z.coerce.number().optional(),
});

locationRouter.get(
  '/geo/autocomplete',
  asyncHandler(async (req, res) => {
    const parsed = autocompleteQuery.safeParse(req.query);
    if (!parsed.success) {
      res.json({ suggestions: [] });
      return;
    }
    const { text, lat, lon } = parsed.data;
    const focus: [number, number] | null = lon != null && lat != null ? [lon, lat] : null;
    const suggestions = await autocompleteAddress(text, focus);
    res.json({ suggestions });
  }),
);

locationRouter.get(
  '/geo/ip',
  asyncHandler(async (req, res) => {
    const location = await ipGeolocate(clientIp(req));
    res.json(location ?? { label: null, coordinates: null });
  }),
);

/** First hop of X-Forwarded-For (real client), falling back to the socket. */
function clientIp(req: Request): string | null {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0]!.trim();
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.length) return real;
  return req.socket.remoteAddress ?? null;
}
