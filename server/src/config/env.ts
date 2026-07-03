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

  get isProd() {
    return this.nodeEnv === 'production';
  },
};
