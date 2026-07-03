import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * Independent mechanic / recovery operator profile.
 * Capabilities determine which job types they can be dispatched for.
 * `location` is a GeoJSON point with a 2dsphere index for proximity dispatch.
 */
const providerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, trim: true },

    // What this provider can do — drives dispatch matching.
    capabilities: {
      roadside: { type: Boolean, default: true },
      recovery: { type: Boolean, default: false },
    },

    // Online/offline toggle (instant dispatch only targets online providers).
    online: { type: Boolean, default: false, index: true },

    // Provider-set rates — untouched by platform commission.
    rates: {
      labourPerHour: { type: Number, default: 0 },
      mileagePerMile: { type: Number, default: 0 },
    },

    // Stripe Connect account for payouts.
    stripeAccountId: { type: String },
    onboardingComplete: { type: Boolean, default: false },

    // GeoJSON point [lng, lat].
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },

    vehicle: {
      make: String,
      model: String,
      registration: String,
    },

    // Compliance documents (OCR-extracted expiries drive auto-suspension).
    // TODO(platform): wire S3 signed-URL storage + OCR expiry extraction.
    documents: [
      {
        kind: { type: String }, // driving_licence | insurance | mot | compliance
        url: String,
        expiresAt: Date,
        verified: { type: Boolean, default: false },
      },
    ],

    rating: { type: Number, default: 5 },
  },
  { timestamps: true },
);

providerSchema.index({ location: '2dsphere' });

export type ProviderDoc = InferSchemaType<typeof providerSchema> & { _id: string };
export const Provider = model('Provider', providerSchema);
