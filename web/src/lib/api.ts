import { site } from './site';

export interface Quote {
  serviceType: 'roadside' | 'recovery' | 'unsure';
  currency: 'GBP';
  baseFee: number;
  commission: number;
  providerNet: number;
  total: number;
  notes: string[];
}

const base = site.apiUrl;

/** Fixed-price quote from the API (public endpoint, no auth needed). */
export async function fetchQuote(serviceType: Quote['serviceType']): Promise<Quote> {
  const res = await fetch(`${base}/api/jobs/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serviceType }),
  });
  if (!res.ok) throw new Error(`Quote failed (${res.status})`);
  const data = (await res.json()) as { quote: Quote };
  return data.quote;
}

export interface CreateJobInput {
  serviceType: Quote['serviceType'];
  description?: string;
  vehicle?: {
    make?: string;
    model?: string;
    registration?: string;
    year?: string;
    colour?: string;
    imageUrl?: string;
  };
  location: { coordinates: [number, number]; address?: string };
  locationConsent: boolean;
}

/** Normalised vehicle details from the DVLA/UK Vehicle Data lookup. */
export interface VehicleLookup {
  registration: string;
  make: string;
  model: string;
  year?: string;
  colour?: string;
  fuelType?: string;
  imageUrl?: string | null;
}

/**
 * Look up a vehicle by number plate via our own Next.js route (which holds the
 * API key server-side). Same-origin, so a relative URL is used — not the
 * Express API base.
 */
export async function lookupVehicle(registration: string): Promise<VehicleLookup> {
  const res = await fetch('/api/vehicle-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registration }),
  });
  const data = (await res.json().catch(() => ({}))) as VehicleLookup & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Lookup failed (${res.status})`);
  }
  return data;
}

/** Create a job (requires a customer access token). */
export async function createJob(input: CreateJobInput, accessToken: string) {
  const res = await fetch(`${base}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Job request failed (${res.status})`);
  }
  return res.json();
}
