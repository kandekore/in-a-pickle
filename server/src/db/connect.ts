import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let connected = false;

export async function connectDb(): Promise<boolean> {
  if (connected) return true;
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 4000 });
    connected = true;
    logger.info('MongoDB connected', { uri: env.mongoUri.replace(/\/\/.*@/, '//***@') });
    return true;
  } catch (err) {
    // The marketing site + many API routes can still boot without Mongo during
    // local dev; we log loudly rather than crash so the thin slice stays usable.
    logger.error('MongoDB connection failed — running in degraded mode', {
      error: (err as Error).message,
    });
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
