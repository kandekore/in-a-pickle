import { settings } from '../config/settings.js';
import { Provider } from '../models/Provider.js';
import type { ServiceType } from '../models/Job.js';

/**
 * Instant job dispatching — find online, capable providers nearest the job.
 *
 * Uses MongoDB's 2dsphere `$near` for proximity. The "unsure" service requires
 * a provider who can do BOTH roadside and recovery. First to accept wins
 * (handled at the socket layer); this just returns the ranked candidate pool.
 */
export async function findCandidates(params: {
  serviceType: ServiceType;
  coordinates: [number, number]; // [lng, lat]
  limit?: number;
}) {
  const { serviceType, coordinates, limit = 10 } = params;

  const capabilityFilter =
    serviceType === 'recovery'
      ? { 'capabilities.recovery': true }
      : serviceType === 'unsure'
        ? { 'capabilities.roadside': true, 'capabilities.recovery': true }
        : { 'capabilities.roadside': true };

  return Provider.find({
    online: true,
    onboardingComplete: true,
    ...capabilityFilter,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: settings.dispatch.searchRadiusKm * 1000,
      },
    },
  })
    .limit(limit)
    .lean();
}
