import { Schema, model, type InferSchemaType } from 'mongoose';

/** The three service types the customer can request (matches the catalogue). */
export const SERVICE_TYPES = ['roadside', 'recovery', 'unsure'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/** Job lifecycle — every transition is audit-logged (see AuditLog TODO). */
export const JOB_STATUSES = [
  'requested', // customer posted, awaiting a provider
  'accepted', // a provider accepted; awaiting payment
  'paid', // customer paid; exact location released to provider
  'en_route', // provider travelling
  'arrived', // provider within arrival radius
  'in_progress', // assessment / work underway
  'completed', // work finished; escrow release window running
  'cancelled',
  'disputed',
  'refunded',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

const jobSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', index: true },

    serviceType: { type: String, enum: SERVICE_TYPES, required: true },
    status: { type: String, enum: JOB_STATUSES, default: 'requested', index: true },

    description: { type: String, trim: true },
    vehicle: {
      make: String,
      model: String,
      registration: String,
    },

    // Customer pickup location (GeoJSON [lng, lat]). Exact coords are only
    // exposed to the provider AFTER payment is confirmed.
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: String,
    },
    locationConsent: { type: Boolean, default: false },

    // Pricing snapshot at request time (from the quoting engine).
    quote: {
      currency: { type: String, default: 'GBP' },
      baseFee: Number, // call-out / recovery fee
      commission: Number, // platform 5%
      providerNet: Number, // baseFee - commission
      total: Number, // what the customer pays upfront
    },

    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },

    // Live tracking snapshot (updated via Socket.IO; not a history log).
    tracking: {
      providerLocation: { type: [Number] }, // [lng, lat]
      etaSeconds: Number,
      heading: Number, // degrees, if the device reports it
      accuracy: Number, // metres, if the device reports it
      updatedAt: Date,
    },

    timeline: {
      acceptedAt: Date,
      paidAt: Date,
      arrivedAt: Date,
      completedAt: Date,
    },
  },
  { timestamps: true },
);

jobSchema.index({ location: '2dsphere' });

export type JobDoc = InferSchemaType<typeof jobSchema> & { _id: string };
export const Job = model('Job', jobSchema);
