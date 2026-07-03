import Stripe from 'stripe';
import { env } from '../config/env.js';
import { settings } from '../config/settings.js';
import { Payment } from '../models/Payment.js';
import type { Quote } from './pricing.service.js';
import { logger } from '../utils/logger.js';

/**
 * Secure payments via Stripe Connect (escrow + automatic commission split).
 *
 * This is a working skeleton: when STRIPE_SECRET_KEY is present we create a
 * real PaymentIntent; otherwise we fall back to a deterministic stub so the
 * end-to-end job flow runs without live credentials. Escrow release, payouts,
 * refunds and Connect onboarding are scaffolded with clear TODOs.
 */
// apiVersion omitted on purpose — Stripe pins it to the account default, and
// hard-coding a literal ties us to one SDK release's type. Set it in the
// dashboard / via config when locking a version for production.
const stripe = env.stripe.secretKey ? new Stripe(env.stripe.secretKey) : null;

export async function createJobPayment(params: {
  jobId: string;
  customerId: string;
  providerId?: string;
  quote: Quote;
}) {
  const { jobId, customerId, providerId, quote } = params;
  const amountMinor = Math.round(quote.total * 100);

  let stripePaymentIntentId: string | undefined;
  let clientSecret: string | undefined;

  if (stripe) {
    // TODO(platform): use Connect destination charges + application_fee_amount
    // to split the 5% commission and hold funds until the escrow release job.
    const intent = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency: quote.currency.toLowerCase(),
      capture_method: 'manual', // hold in escrow until arrival/confirmation
      metadata: { jobId, serviceType: quote.serviceType },
    });
    stripePaymentIntentId = intent.id;
    clientSecret = intent.client_secret ?? undefined;
  } else {
    stripePaymentIntentId = `pi_stub_${jobId}`;
    clientSecret = `stub_secret_${jobId}`;
    logger.warn('Stripe not configured — using stub PaymentIntent', { jobId });
  }

  const payment = await Payment.create({
    job: jobId,
    customer: customerId,
    provider: providerId,
    currency: quote.currency,
    amount: quote.total,
    commission: quote.commission,
    providerNet: quote.providerNet,
    status: 'pending',
    stripePaymentIntentId,
  });

  return { payment, clientSecret };
}

/** Mark funds captured into escrow once the customer confirms payment. */
export async function holdFunds(paymentId: string) {
  const payment = await Payment.findById(paymentId);
  if (!payment) return null;
  // TODO(platform): stripe.paymentIntents.capture(payment.stripePaymentIntentId)
  payment.status = 'held';
  payment.heldAt = new Date();
  payment.releaseDueAt = new Date(
    Date.now() + settings.escrow.autoReleaseAfterArrivalMinutes * 60_000,
  );
  await payment.save();
  return payment;
}

/** Auto-release escrow to the provider after the hold window (no dispute). */
export async function releaseFunds(paymentId: string) {
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== 'held') return null;
  // TODO(platform): stripe.transfers.create to the provider's Connect account.
  payment.status = 'released';
  payment.releasedAt = new Date();
  await payment.save();
  return payment;
}
