import { settings } from '../config/settings.js';
import type { ServiceType } from '../models/Job.js';

export interface Quote {
  serviceType: ServiceType;
  currency: 'GBP';
  baseFee: number; // call-out / recovery fee charged upfront
  commission: number; // platform 5%
  providerNet: number; // baseFee - commission (paid to provider)
  total: number; // amount the customer pays now
  notes: string[];
}

/**
 * Fixed-price quoting engine.
 *
 * Transparent, upfront pricing from the catalogue:
 *   roadside £50 · recovery £80 · unsure £100.
 * Platform commission is a flat 5% of the call-out/recovery fee; labour, parts
 * and extra mileage are billed separately by the provider and never touched.
 * All values come from configurable `settings`.
 */
export function quoteJob(serviceType: ServiceType): Quote {
  const { pricing, commissionRate } = settings;

  const baseFee =
    serviceType === 'recovery'
      ? pricing.recovery
      : serviceType === 'unsure'
        ? pricing.unsure
        : pricing.roadsideAssistance;

  const commission = round2(baseFee * commissionRate);
  const providerNet = round2(baseFee - commission);

  const notes: string[] = [];
  if (serviceType === 'roadside') {
    notes.push(`Includes arrival + up to ${settings.assistance.windowMinutes} min on-scene assessment.`);
  } else if (serviceType === 'recovery') {
    notes.push(`Includes recovery within ${settings.recovery.includedMiles} miles; extra mileage at the operator's transparent rate.`);
  } else {
    notes.push(`Sends providers who can do both. ${settings.assistance.unsureWindowMinutes} min inspection; £${pricing.unsureAssistanceOnlyRefund} refunded if recovery isn't needed.`);
  }
  notes.push('Labour, parts and extra mileage are charged separately by the provider and are 100% theirs.');

  return {
    serviceType,
    currency: settings.currency,
    baseFee,
    commission,
    providerNet,
    total: baseFee,
    notes,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
