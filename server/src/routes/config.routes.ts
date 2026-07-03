import { Router } from 'express';
import { settings } from '../config/settings.js';
import { env } from '../config/env.js';

export const configRouter = Router();

/**
 * Public, client-safe runtime configuration. Consumed by the web app's
 * LocationService and — unchanged — by a future React Native client, so map
 * style and tracking cadences are never hard-coded on the client.
 *
 * NOTE: only non-secret values are exposed here. The OpenRouteService key stays
 * server-side and is used exclusively by the routing proxy.
 */
configRouter.get('/config', (_req, res) => {
  res.json({
    tracking: {
      gpsUpdateIntervalSeconds: settings.tracking.gpsUpdateIntervalSeconds,
      providerPingSeconds: settings.tracking.providerPingSeconds,
      routeRefreshSeconds: settings.tracking.routeRefreshSeconds,
      arrivalRadiusMeters: settings.tracking.arrivalRadiusMeters,
    },
    map: {
      styleUrl: env.map.styleUrl,
    },
  });
});
