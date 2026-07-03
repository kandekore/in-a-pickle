import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { isDbConnected } from '../db/connect.js';
import { Provider } from '../models/Provider.js';
import { Job, type ServiceType } from '../models/Job.js';
import { settings } from '../config/settings.js';
import { notify } from '../services/notification.service.js';
import { startTrackingSim, stopTracking } from '../services/tracking.service.js';
import { getIO } from '../sockets/io.js';

export const providerRouter = Router();

providerRouter.use('/provider', requireAuth, requireRole('provider'));

function ensureDb() {
  if (!isDbConnected()) throw new HttpError(503, 'Database unavailable');
}

/** Resolve the Provider profile for the authenticated provider user. */
async function getProvider(userId: string) {
  const provider = await Provider.findOne({ user: userId });
  if (!provider) throw new HttpError(404, 'Provider profile not found');
  return provider;
}

/** Which service types a provider may take, based on capabilities. */
function allowedServiceTypes(caps?: { roadside?: boolean; recovery?: boolean }): ServiceType[] {
  const allowed: ServiceType[] = [];
  if (caps?.roadside) allowed.push('roadside');
  if (caps?.recovery) allowed.push('recovery');
  if (caps?.roadside && caps?.recovery) allowed.push('unsure'); // needs both
  return allowed;
}

/** Forward-only job status transitions a provider may perform. */
const NEXT_STATUS: Record<string, string> = {
  accepted: 'en_route',
  en_route: 'arrived',
  arrived: 'in_progress',
  in_progress: 'completed',
};

/** Provider profile + headline stats. */
providerRouter.get(
  '/provider/me',
  asyncHandler(async (req, res) => {
    ensureDb();
    const provider = await getProvider(req.auth!.sub);
    const [activeJobs, completedJobs] = await Promise.all([
      Job.countDocuments({ provider: provider._id, status: { $in: ['accepted', 'en_route', 'arrived', 'in_progress'] } }),
      Job.countDocuments({ provider: provider._id, status: 'completed' }),
    ]);
    res.json({ provider, stats: { activeJobs, completedJobs } });
  }),
);

/** Toggle Online/Offline (instant-dispatch presence). */
const statusSchema = z.object({ online: z.boolean() });

providerRouter.patch(
  '/provider/status',
  asyncHandler(async (req, res) => {
    ensureDb();
    const { online } = statusSchema.parse(req.body);
    const provider = await getProvider(req.auth!.sub);
    provider.online = online;
    await provider.save();
    res.json({ online: provider.online });
  }),
);

/** Update capabilities, rates and vehicle. */
const profileSchema = z.object({
  businessName: z.string().optional(),
  capabilities: z.object({ roadside: z.boolean(), recovery: z.boolean() }).optional(),
  rates: z.object({ labourPerHour: z.number().min(0), mileagePerMile: z.number().min(0) }).optional(),
  vehicle: z.object({ make: z.string().optional(), model: z.string().optional(), registration: z.string().optional() }).optional(),
});

providerRouter.patch(
  '/provider/profile',
  asyncHandler(async (req, res) => {
    ensureDb();
    const input = profileSchema.parse(req.body);
    const provider = await getProvider(req.auth!.sub);
    if (input.businessName !== undefined) provider.businessName = input.businessName;
    if (input.capabilities) provider.capabilities = input.capabilities;
    if (input.rates) provider.rates = input.rates;
    if (input.vehicle) provider.set('vehicle', input.vehicle);
    await provider.save();
    res.json({ provider });
  }),
);

/**
 * Incoming job feed — open jobs near the provider that match their
 * capabilities. Empty when the provider is offline (mirrors the live app).
 */
providerRouter.get(
  '/provider/jobs/available',
  asyncHandler(async (req, res) => {
    ensureDb();
    const provider = await getProvider(req.auth!.sub);
    if (!provider.online) return res.json({ jobs: [], offline: true });

    const types = allowedServiceTypes(provider.capabilities ?? undefined);
    if (types.length === 0) return res.json({ jobs: [] });

    const coords = provider.location?.coordinates ?? [0, 0];
    const jobs = await Job.find({
      status: 'requested',
      serviceType: { $in: types },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: coords },
          $maxDistance: settings.dispatch.searchRadiusKm * 1000,
        },
      },
    })
      .limit(25)
      .lean();

    // Before acceptance the provider sees the job type + fee, not exact location.
    const sanitised = jobs.map((j) => ({
      id: String(j._id),
      serviceType: j.serviceType,
      description: j.description,
      vehicle: j.vehicle,
      quote: j.quote,
      area: j.location?.address ?? 'Location shared after acceptance',
      createdAt: j.createdAt,
    }));
    res.json({ jobs: sanitised });
  }),
);

/**
 * Accept a job — atomic first-come-first-served. Only one provider can win a
 * job that is still 'requested'.
 */
providerRouter.post(
  '/provider/jobs/:id/accept',
  asyncHandler(async (req, res) => {
    ensureDb();
    const provider = await getProvider(req.auth!.sub);

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, status: 'requested' },
      { $set: { provider: provider._id, status: 'accepted', 'timeline.acceptedAt': new Date() } },
      { new: true },
    );
    if (!job) throw new HttpError(409, 'This job is no longer available');

    // Notify the customer that a provider is on the way (payment unlocks location).
    await notify({
      userId: String(job.customer),
      jobId: String(job._id),
      type: 'job_accepted',
      title: 'A provider accepted your request',
      body: `${provider.businessName ?? 'Your provider'} accepted your ${job.serviceType} job.`,
      channels: ['in_app', 'sms'],
    });

    res.json({ job });
  }),
);

/** Jobs this provider has accepted (with full customer location). */
providerRouter.get(
  '/provider/jobs/mine',
  asyncHandler(async (req, res) => {
    ensureDb();
    const provider = await getProvider(req.auth!.sub);
    const jobs = await Job.find({ provider: provider._id })
      .sort('-updatedAt')
      .limit(50)
      .populate('customer', 'name phone')
      .lean();
    res.json({ jobs });
  }),
);

/** Advance a job's status along the allowed forward path. */
providerRouter.post(
  '/provider/jobs/:id/advance',
  asyncHandler(async (req, res) => {
    ensureDb();
    const provider = await getProvider(req.auth!.sub);
    const job = await Job.findOne({ _id: req.params.id, provider: provider._id });
    if (!job) throw new HttpError(404, 'Job not found');

    const next = NEXT_STATUS[job.status];
    if (!next) throw new HttpError(400, `Cannot advance from '${job.status}'`);

    job.status = next as typeof job.status;
    if (next === 'arrived') job.set('timeline.arrivedAt', new Date());
    if (next === 'completed') job.set('timeline.completedAt', new Date());
    await job.save();

    // Real-time tracking lifecycle: start the live feed when en route,
    // stop it once the provider has arrived or finished.
    if (next === 'en_route') {
      const start = provider.location?.coordinates as [number, number] | undefined;
      const dest = job.location?.coordinates as [number, number] | undefined;
      if (start && dest) startTrackingSim(String(job._id), start, dest);
    } else if (next === 'arrived' || next === 'completed') {
      stopTracking(String(job._id));
    }
    getIO()?.to(`job:${String(job._id)}`).emit('job:status', { jobId: String(job._id), status: next });

    await notify({
      userId: String(job.customer),
      jobId: String(job._id),
      type: `job_${next}`,
      title: `Update: ${next.replace('_', ' ')}`,
      body: `Your ${job.serviceType} job is now '${next.replace('_', ' ')}'.`,
      channels: ['in_app'],
    });

    res.json({ job });
  }),
);
