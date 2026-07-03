import { Schema, model, type InferSchemaType } from 'mongoose';

/** Mirrors Stripe state so we can reason about escrow without calling Stripe. */
export const PAYMENT_STATUSES = [
  'pending', // intent created, not captured
  'held', // captured into escrow
  'released', // paid out to provider
  'refunded',
  'partially_refunded',
  'failed',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const paymentSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'Provider' },

    currency: { type: String, default: 'GBP' },
    amount: { type: Number, required: true }, // total charged (minor unit handled at Stripe layer)
    commission: { type: Number, required: true }, // platform cut
    providerNet: { type: Number, required: true },

    status: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },

    // Stripe references — populated by payment.service.
    stripePaymentIntentId: String,
    stripeTransferId: String,
    stripeRefundId: String,

    // Escrow auto-release bookkeeping.
    heldAt: Date,
    releaseDueAt: Date,
    releasedAt: Date,
  },
  { timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof paymentSchema> & { _id: string };
export const Payment = model('Payment', paymentSchema);
