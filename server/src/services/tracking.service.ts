import { getIO } from '../sockets/io.js';
import { settings } from '../config/settings.js';
import { Job } from '../models/Job.js';
import { notify } from './notification.service.js';
import { logger } from '../utils/logger.js';

/**
 * Live tracking simulator.
 *
 * Real provider apps push GPS over Socket.IO; for the web demo we interpolate
 * the provider's position from their start point toward the customer and emit
 * `tracking:update` to the job room every few seconds, recomputing ETA and
 * auto-marking the job `arrived` once inside the configured arrival radius.
 *
 * This is the ONLY simulated piece — the transport, rooms, payload shape and
 * arrival logic are exactly what a real device feed would drive.
 */

const DEMO_TICK_MS = 3000; // faster than settings.gpsUpdateInterval so the demo is watchable
const ASSUMED_SPEED_MPS = 11; // ~25 mph for ETA estimation
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
    const etaSeconds = Math.max(0, Math.round(remaining / ASSUMED_SPEED_MPS));

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
