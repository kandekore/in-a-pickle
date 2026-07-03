import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { isDbConnected } from '../db/connect.js';
import { User } from '../models/User.js';
import { Provider } from '../models/Provider.js';
import { Job, JOB_STATUSES } from '../models/Job.js';
import { Payment } from '../models/Payment.js';
import { notify } from '../services/notification.service.js';

export const adminRouter = Router();

// Every admin route requires a valid token AND the admin role (RBAC).
adminRouter.use('/admin', requireAuth, requireRole('admin'));

function ensureDb() {
  if (!isDbConnected()) throw new HttpError(503, 'Database unavailable');
}

/** Overview counts for the dashboard cards. */
adminRouter.get(
  '/admin/stats',
  asyncHandler(async (_req, res) => {
    ensureDb();
    const [usersByRole, jobsByStatus, providersOnline, payments] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Provider.countDocuments({ online: true }),
      Payment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
            commission: { $sum: '$commission' },
          },
        },
      ]),
    ]);

    const roleMap = Object.fromEntries(usersByRole.map((r) => [r._id, r.count]));
    const statusMap = Object.fromEntries(jobsByStatus.map((s) => [s._id, s.count]));
    const grossRevenue = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const commissionRevenue = payments.reduce((sum, p) => sum + (p.commission ?? 0), 0);

    res.json({
      users: {
        total: (Object.values(roleMap) as number[]).reduce((a, b) => a + b, 0),
        customers: roleMap.customer ?? 0,
        providers: roleMap.provider ?? 0,
        admins: roleMap.admin ?? 0,
      },
      providersOnline,
      jobs: {
        total: (Object.values(statusMap) as number[]).reduce((a, b) => a + b, 0),
        active: (statusMap.accepted ?? 0) + (statusMap.paid ?? 0) + (statusMap.en_route ?? 0) + (statusMap.arrived ?? 0) + (statusMap.in_progress ?? 0),
        byStatus: statusMap,
      },
      payments: {
        grossRevenue: round2(grossRevenue),
        commissionRevenue: round2(commissionRevenue),
        byStatus: Object.fromEntries(payments.map((p) => [p._id, { count: p.count, amount: round2(p.amount ?? 0) }])),
      },
    });
  }),
);

/** Live + recent jobs (the brief's "live jobs" admin view). */
adminRouter.get(
  '/admin/jobs',
  asyncHandler(async (req, res) => {
    ensureDb();
    const status = req.query.status as string | undefined;
    const filter = status && (JOB_STATUSES as readonly string[]).includes(status) ? { status } : {};
    const jobs = await Job.find(filter)
      .sort('-createdAt')
      .limit(100)
      .populate('customer', 'name email')
      .populate({ path: 'provider', select: 'businessName user', populate: { path: 'user', select: 'name email' } })
      .lean();
    res.json({ jobs });
  }),
);

/** All users (RBAC management). */
adminRouter.get(
  '/admin/users',
  asyncHandler(async (_req, res) => {
    ensureDb();
    const users = await User.find().sort('-createdAt').limit(200).lean();
    res.json({ users });
  }),
);

/** Providers + compliance snapshot. */
adminRouter.get(
  '/admin/providers',
  asyncHandler(async (_req, res) => {
    ensureDb();
    const providers = await Provider.find()
      .sort('-createdAt')
      .limit(200)
      .populate('user', 'name email phone suspended')
      .lean();
    res.json({ providers });
  }),
);

/** Payment / escrow ledger. */
adminRouter.get(
  '/admin/payments',
  asyncHandler(async (_req, res) => {
    ensureDb();
    const payments = await Payment.find()
      .sort('-createdAt')
      .limit(200)
      .populate('customer', 'name email')
      .lean();
    res.json({ payments });
  }),
);

/** Admin override: suspend / reinstate a user account. */
const suspendSchema = z.object({ suspended: z.boolean(), reason: z.string().optional() });

adminRouter.patch(
  '/admin/users/:id/suspension',
  asyncHandler(async (req, res) => {
    ensureDb();
    const { suspended, reason } = suspendSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, { suspended }, { new: true });
    if (!user) throw new HttpError(404, 'User not found');

    // TODO(platform): write an AuditLog entry for this compliance action.
    await notify({
      userId: String(user._id),
      type: suspended ? 'account_suspended' : 'account_reinstated',
      title: suspended ? 'Your account has been suspended' : 'Your account has been reinstated',
      body: reason ?? (suspended ? 'Please contact support.' : 'Welcome back — you can go Online again.'),
      channels: ['in_app', 'email'],
    });

    res.json({ id: String(user._id), suspended: user.suspended });
  }),
);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
