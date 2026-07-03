import { getIO } from '../sockets/io.js';
import { settings } from '../config/settings.js';
import { Job } from '../models/Job.js';
import { notify } from './notification.service.js';
import { logger } from '../utils/logger.js';

/**
 * Live tracking service.
 *
 * Production path: real provider devices push GPS over Socket.IO; the socket
 * layer calls `recordProviderLocation()` which persists the snapshot to
 * `Job.tracking`, re-broadcasts `tracking:update` to the job room, and
 * auto-marks the job `arrived` once inside the configured arrival radius.
 *
 * Demo path (opt-in): `startTrackingSim()` interpolates a provider's approach
 * for a hands-free demo. It is gated behind `env.tracking.simulatorEnabled`
 * (TRACKING_SIMULATOR=true) and is OFF by default — see provider.routes.ts.
 *
 * Both paths share the same transport, rooms, payload shape and arrival logic.
 */

const DEMO_TICK_MS = 3000; // faster than settings.gpsUpdateInterval so the demo is watchable
const STEPS = 10;

const active = new Map<string, NodeJS.Timeout>();

type LngLat = [number, number];

/** Haversine distance in metres. */
function distanceMeters([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isTracking(jobId: string): boolean {
  return active.has(jobId);
}

interface LocationMeta {
  heading?: number | null;
  accuracy?: number | null;
}

/**
 * Record a REAL provider GPS fix for a job (the production tracking path).
 *
 * Persists the snapshot to `Job.tracking`, broadcasts `tracking:update` to the
 * job room, and — reusing the same arrival logic as the simulator — auto-marks
 * the job `arrived` once inside the configured radius. A cheap straight-line ETA
 * (assumedSpeedMps) is stored so list views and initial loads always have a
 * value without calling the routing provider on every fix.
 *
 * Consumers draw the accurate ORS route/ETA client-side via LocationService.
 */
export async function recordProviderLocation(
  jobId: string,
  here: LngLat,
  meta: LocationMeta = {},
): Promise<void> {
  const io = getIO();
  const job = await Job.findById(jobId);
  if (!job) return;

  const dest = job.location?.coordinates as LngLat | undefined;
  const hasDest = Array.isArray(dest) && dest.length === 2;
  const remaining = hasDest ? distanceMeters(here, dest!) : undefined;
  const etaSeconds =
    remaining != null ? Math.max(0, Math.round(remaining / settings.tracking.assumedSpeedMps)) : undefined;

  await Job.findByIdAndUpdate(jobId, {
    $set: {
      'tracking.providerLocation': here,
      'tracking.etaSeconds': etaSeconds,
      'tracking.heading': meta.heading ?? undefined,
      'tracking.accuracy': meta.accuracy ?? undefined,
      'tracking.updatedAt': new Date(),
    },
  }).catch(() => undefined);

  io?.to(`job:${jobId}`).emit('tracking:update', {
    jobId,
    lng: here[0],
    lat: here[1],
    etaSeconds,
    remainingMeters: remaining != null ? Math.round(remaining) : undefined,
    heading: meta.heading ?? undefined,
    accuracy: meta.accuracy ?? undefined,
    arrivalRadiusMeters: settings.tracking.arrivalRadiusMeters,
    at: new Date().toISOString(),
  });

  // Auto-arrival — identical rule to the simulator.
  if (
    remaining != null &&
    remaining <= settings.tracking.arrivalRadiusMeters &&
    ['en_route', 'accepted', 'paid'].includes(job.status)
  ) {
    job.status = 'arrived';
    job.set('timeline.arrivedAt', new Date());
    await job.save();
    stopTracking(jobId); // stop any demo simulator that may also be running
    io?.to(`job:${jobId}`).emit('job:status', { jobId, status: 'arrived' });
    await notify({
      userId: String(job.customer),
      jobId,
      type: 'job_arrived',
      title: 'Your provider has arrived',
      body: 'Your provider is at your location.',
      channels: ['in_app', 'sms'],
    });
    logger.info('Provider arrived (real GPS)', { jobId });
  }
}

export function stopTracking(jobId: string): void {
  const t = active.get(jobId);
  if (t) {
    clearInterval(t);
    active.delete(jobId);
  }
}

/**
 * Begin simulating the provider's approach for a job.
 * @param start provider's starting [lng, lat]
 * @param destination customer's [lng, lat]
 */
export function startTrackingSim(jobId: string, start: LngLat, destination: LngLat): void {
  stopTracking(jobId); // never double-run
  const io = getIO();
  const arrivalRadius = settings.tracking.arrivalRadiusMeters;
  let step = 0;

  const tick = async () => {
    step += 1;
    const frac = Math.min(step / STEPS, 1);
    const lng = start[0] + (destination[0] - start[0]) * frac;
    const lat = start[1] + (destination[1] - start[1]) * frac;
    const here: LngLat = [lng, lat];
    const remaining = distanceMeters(here, destination);
    const etaSeconds = Math.max(0, Math.round(remaining / settings.tracking.assumedSpeedMps));

    io?.to(`job:${jobId}`).emit('tracking:update', {
      jobId,
      lng,
      lat,
      etaSeconds,
      remainingMeters: Math.round(remaining),
      at: new Date().toISOString(),
    });

    // Persist the latest tracking snapshot (not a history log).
    await Job.findByIdAndUpdate(jobId, {
      $set: { 'tracking.providerLocation': here, 'tracking.etaSeconds': etaSeconds, 'tracking.updatedAt': new Date() },
    }).catch(() => undefined);

    if (remaining <= arrivalRadius || frac >= 1) {
      stopTracking(jobId);
      const job = await Job.findById(jobId);
      if (job && ['en_route', 'accepted', 'paid'].includes(job.status)) {
        job.status = 'arrived';
        job.set('timeline.arrivedAt', new Date());
        await job.save();
        io?.to(`job:${jobId}`).emit('job:status', { jobId, status: 'arrived' });
        await notify({
          userId: String(job.customer),
          jobId,
          type: 'job_arrived',
          title: 'Your provider has arrived',
          body: 'Your provider is at your location.',
          channels: ['in_app', 'sms'],
        });
      }
      logger.info('Tracking simulation arrived', { jobId });
    }
  };

  const timer = setInterval(tick, DEMO_TICK_MS);
  active.set(jobId, timer);
  logger.info('Tracking simulation started', { jobId });
  // fire an immediate first update so the map populates without waiting a tick
  void tick();
}
