import { Router } from 'express';
import { z } from 'zod';
import { Job, SERVICE_TYPES } from '../models/Job.js';
import { Provider } from '../models/Provider.js';
import { quoteJob } from '../services/pricing.service.js';
import { createJobPayment } from '../services/payment.service.js';
import { findCandidates } from '../services/dispatch.service.js';
import { notify } from '../services/notification.service.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { isDbConnected } from '../db/connect.js';

export const jobsRouter = Router();

/**
 * Public fixed-price quote. No DB or auth required so the marketing site's
 * "Request Help" page can always show transparent, upfront pricing.
 */
const quoteSchema = z.object({ serviceType: z.enum(SERVICE_TYPES) });

jobsRouter.post(
  '/jobs/quote',
  asyncHandler(async (req, res) => {
    const { serviceType } = quoteSchema.parse(req.body);
    res.json({ quote: quoteJob(serviceType) });
  }),
);

/**
 * Create a job (customer). End-to-end slice:
 *   quote → persist job → create (stub) PaymentIntent → dispatch to nearest
 *   online, capable providers → notify candidates.
 * First provider to accept wins (handled over Socket.IO).
 */
const createSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES),
  description: z.string().max(2000).optional(),
  vehicle: z
    .object({ make: z.string().optional(), model: z.string().optional(), registration: z.string().optional() })
    .optional(),
  location: z.object({
    coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
    address: z.string().optional(),
  }),
  locationConsent: z.boolean(),
});

jobsRouter.post(
  '/jobs',
  requireAuth,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    if (!isDbConnected()) throw new HttpError(503, 'Database unavailable — cannot persist jobs');

    const input = createSchema.parse(req.body);
    if (!input.locationConsent) {
      throw new HttpError(400, 'Location sharing consent is required to dispatch a provider');
    }

    const quote = quoteJob(input.serviceType);

    const job = await Job.create({
      customer: req.auth!.sub,
      serviceType: input.serviceType,
      description: input.description,
      vehicle: input.vehicle,
      location: { type: 'Point', coordinates: input.location.coordinates, address: input.location.address },
      locationConsent: input.locationConsent,
      quote,
      status: 'requested',
    });

    const { payment, clientSecret } = await createJobPayment({
      jobId: String(job._id),
      customerId: req.auth!.sub,
      quote,
    });
    job.payment = payment._id;
    await job.save();

    // Instant dispatch — rank nearby candidates (no exact location revealed yet).
    const candidates = await findCandidates({
      serviceType: input.serviceType,
      coordinates: input.location.coordinates,
    });

    // Notify candidate providers (in-app + SMS stub). Full details unlock on payment.
    await Promise.all(
      candidates.map((c) =>
        notify({
          userId: String(c.user),
          jobId: String(job._id),
          type: 'new_job_request',
          title: 'New job request',
          body: `New ${input.serviceType} job available near you.`,
          channels: ['in_app', 'sms'],
        }),
      ),
    );

    res.status(201).json({
      job: {
        id: String(job._id),
        serviceType: job.serviceType,
        status: job.status,
        quote,
      },
      payment: { clientSecret, status: payment.status },
      dispatch: { candidatesNotified: candidates.length },
    });
  }),
);

/** List the authenticated customer's jobs. */
jobsRouter.get(
  '/jobs/mine',
  requireAuth,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    if (!isDbConnected()) return res.json({ jobs: [] });
    const jobs = await Job.find({ customer: req.auth!.sub }).sort('-createdAt').limit(50).lean();
    res.json({ jobs });
  }),
);

/**
 * Single job detail — authorised for the owning customer, the assigned
 * provider, or an admin. Powers the customer live-tracking view.
 * Declared last so the literal `/jobs/mine` and `/jobs/quote` routes win.
 */
jobsRouter.get(
  '/jobs/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!isDbConnected()) throw new HttpError(503, 'Database unavailable');
    const job = await Job.findById(req.params.id)
      .populate({ path: 'provider', select: 'businessName vehicle user', populate: { path: 'user', select: 'name phone' } })
      .lean();
    if (!job) throw new HttpError(404, 'Job not found');

    const { sub, role } = req.auth!;
    let allowed = role === 'admin' || String(job.customer) === sub;
    if (!allowed && role === 'provider') {
      const provider = await Provider.findOne({ user: sub }).select('_id').lean();
      allowed = Boolean(provider && job.provider && String((job.provider as { _id: unknown })._id) === String(provider._id));
    }
    if (!allowed) throw new HttpError(403, 'Not authorised to view this job');

    res.json({ job });
  }),
);
