import 'dotenv/config';

/** Centralised, typed access to environment variables. Secrets never hard-coded. */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/in_a_pickle',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID ?? '',
  },

  mapboxToken: process.env.MAPBOX_TOKEN ?? '',

  // OpenRouteService (routing + reverse geocoding). Proxied server-side so the
  // key is never exposed to the browser or a future React Native client.
  ors: {
    apiKey: process.env.ORS_API_KEY ?? '',
    baseUrl: process.env.ORS_BASE_URL ?? 'https://api.openrouteservice.org',
  },

  // Map style handed to MapLibre GL on the client (via GET /api/config).
  // Defaults to OpenFreeMap "liberty" — full OpenStreetMap streets, keyless.
  // For production-grade tiles/SLA set MAP_STYLE_URL to a keyed provider
  // (MapTiler / Stadia).
  map: {
    styleUrl: process.env.MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty',
  },

  // Live tracking runtime flags.
  tracking: {
    // The interpolating movement simulator is OFF by default — real provider
    // GPS drives tracking. Set TRACKING_SIMULATOR=true for demos/tests.
    simulatorEnabled: process.env.TRACKING_SIMULATOR === 'true',
  },

  get isProd() {
    return this.nodeEnv === 'production';
  },
};
