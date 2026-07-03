/**
 * Seed a handful of online providers near London so instant dispatch returns
 * real matches. Idempotent — re-running upserts the same accounts by email.
 *
 *   npm run seed -w server
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from '../db/connect.js';
import { User } from '../models/User.js';
import { Provider } from '../models/Provider.js';
import { logger } from '../utils/logger.js';

interface SeedProvider {
  name: string;
  email: string;
  businessName: string;
  area: string;
  coordinates: [number, number]; // [lng, lat]
  roadside: boolean;
  recovery: boolean;
  vehicle: { make: string; model: string; registration: string };
  labourPerHour: number;
  mileagePerMile: number;
}

const SEED: SeedProvider[] = [
  {
    name: 'Sam Patel',
    email: 'sam.roadside@pickle.test',
    businessName: 'Patel Mobile Mechanics',
    area: 'Westminster',
    coordinates: [-0.1276, 51.5072],
    roadside: true,
    recovery: false,
    vehicle: { make: 'Ford', model: 'Transit', registration: 'LP19 RSW' },
    labourPerHour: 55,
    mileagePerMile: 0,
  },
  {
    name: 'Dervla O’Connor',
    email: 'dervla.recovery@pickle.test',
    businessName: 'O’Connor Vehicle Recovery',
    area: 'Camden',
    coordinates: [-0.1426, 51.539],
    roadside: false,
    recovery: true,
    vehicle: { make: 'Iveco', model: 'Eurocargo', registration: 'CM20 RCV' },
    labourPerHour: 0,
    mileagePerMile: 2.5,
  },
  {
    name: 'Marcus Hayle',
    email: 'marcus.both@pickle.test',
    businessName: 'Hayle Roadside & Recovery',
    area: 'Brixton',
    coordinates: [-0.1145, 51.4613],
    roadside: true,
    recovery: true,
    vehicle: { make: 'DAF', model: 'LF', registration: 'BX21 HRR' },
    labourPerHour: 60,
    mileagePerMile: 2.0,
  },
  {
    name: 'Aisha Khan',
    email: 'aisha.both@pickle.test',
    businessName: 'Khan Auto Assist',
    area: 'Stratford',
    coordinates: [-0.0042, 51.5416],
    roadside: true,
    recovery: true,
    vehicle: { make: 'Mercedes', model: 'Sprinter', registration: 'ST22 KAA' },
    labourPerHour: 58,
    mileagePerMile: 1.8,
  },
];

async function run() {
  const ok = await connectDb();
  if (!ok) {
    logger.error('Cannot seed — MongoDB is not reachable');
    process.exit(1);
  }

  // Fixed admin account (no public admin signup). Password from env, else default.
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@pickle.test';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      $set: { name: 'Platform Admin', role: 'admin', suspended: false },
      $setOnInsert: { passwordHash: adminHash },
    },
    { upsert: true, new: true },
  );
  logger.info('Seeded admin', { email: adminEmail, password: adminPassword });

  const passwordHash = await bcrypt.hash('provider123', 12);

  for (const p of SEED) {
    const user = await User.findOneAndUpdate(
      { email: p.email },
      {
        $set: {
          name: p.name,
          phone: '07700 900000',
          role: 'provider',
          smsOptIn: true,
          suspended: false,
        },
        $setOnInsert: { passwordHash },
      },
      { upsert: true, new: true },
    );

    await Provider.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          businessName: p.businessName,
          capabilities: { roadside: p.roadside, recovery: p.recovery },
          online: true,
          onboardingComplete: true,
          rates: { labourPerHour: p.labourPerHour, mileagePerMile: p.mileagePerMile },
          location: { type: 'Point', coordinates: p.coordinates },
          vehicle: p.vehicle,
          rating: 4.8,
        },
      },
      { upsert: true, new: true },
    ).then(async (provider) => {
      if (provider && String(user.provider) !== String(provider._id)) {
        user.provider = provider._id;
        await user.save();
      }
    });

    const caps = [p.roadside && 'roadside', p.recovery && 'recovery'].filter(Boolean).join('+');
    logger.info('Seeded provider', { businessName: p.businessName, area: p.area, caps });
  }

  logger.info(`Seed complete — ${SEED.length} online providers near London`, {
    login: 'any seeded email / password: provider123',
  });
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  logger.error('Seed failed', { error: (err as Error).message });
  process.exit(1);
});
