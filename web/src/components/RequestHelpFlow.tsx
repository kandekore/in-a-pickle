'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchQuote, createJob, lookupVehicle, type Quote, type VehicleLookup } from '@/lib/api';
import { products } from '@/lib/site';

type ServiceType = Quote['serviceType'];

const SERVICES: { type: ServiceType; name: string; price: number; blurb: string }[] = products.map(
  (p) => ({ type: p.serviceType, name: p.name, price: p.price, blurb: p.shortDescription }),
);

/** Local fallback quote so the page still works if the API is offline. */
function localQuote(type: ServiceType): Quote {
  const price = SERVICES.find((s) => s.type === type)!.price;
  const commission = +(price * 0.05).toFixed(2);
  return {
    serviceType: type,
    currency: 'GBP',
    baseFee: price,
    commission,
    providerNet: +(price - commission).toFixed(2),
    total: price,
    notes: ['Live quote unavailable — showing the standard fixed price.'],
  };
}

/** A UK-style number-plate badge. */
function PlateBadge({ reg }: { reg: string }) {
  return (
    <span className="inline-flex items-stretch overflow-hidden rounded-md border border-black/20 font-mono text-sm font-bold shadow-sm">
      <span className="flex items-center bg-[#0a4bc2] px-1.5 text-[0.6rem] font-bold text-white">UK</span>
      <span className="bg-accent px-2.5 py-1 uppercase tracking-wider text-night">{reg}</span>
    </span>
  );
}

export default function RequestHelpFlow() {
  const params = useSearchParams();
  const initial = (params.get('service') as ServiceType) ?? 'roadside';

  const [service, setService] = useState<ServiceType>(
    SERVICES.some((s) => s.type === initial) ? initial : 'roadside',
  );
  const [quote, setQuote] = useState<Quote | null>(null);
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Vehicle lookup state ──
  const [plate, setPlate] = useState('');
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [found, setFound] = useState<VehicleLookup | null>(null); // awaiting confirmation
  const [vehicle, setVehicle] = useState<VehicleLookup | null>(null); // confirmed
  const [manual, setManual] = useState(false);

  // Live fixed-price quote from the API whenever the service changes.
  useEffect(() => {
    let active = true;
    setQuote(null);
    fetchQuote(service)
      .then((q) => active && setQuote(q))
      .catch(() => active && setQuote(localQuote(service)));
    return () => {
      active = false;
    };
  }, [service]);

  async function runLookup() {
    setLookupError(null);
    setFound(null);
    const reg = plate.trim();
    if (reg.length < 2) {
      setLookupError('Enter your number plate to look up your vehicle.');
      return;
    }
    setLooking(true);
    try {
      const v = await lookupVehicle(reg);
      setFound(v);
    } catch (err) {
      setLookupError((err as Error).message);
    } finally {
      setLooking(false);
    }
  }

  function changeVehicle() {
    setVehicle(null);
    setFound(null);
    setLookupError(null);
  }

  function useMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords([pos.coords.longitude, pos.coords.latitude]),
      () => setError('Could not get your location. You can still describe where you are.'),
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!consent) {
      setError('Please consent to sharing your location so a provider can reach you.');
      return;
    }
    setSubmitting(true);
    const form = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    const location: [number, number] = coords ?? [-0.1276, 51.5072]; // fallback: London

    // Confirmed lookup wins; otherwise fall back to any manual entry.
    const vehiclePayload = vehicle
      ? {
          make: vehicle.make,
          model: vehicle.model,
          registration: vehicle.registration,
          year: vehicle.year,
          colour: vehicle.colour,
          imageUrl: vehicle.imageUrl ?? undefined,
        }
      : { make: form.make, model: form.model, registration: (form.registration ?? '').toUpperCase() };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('iap_access_token') : null;
      if (token) {
        const res = await createJob(
          {
            serviceType: service,
            description: form.description,
            vehicle: vehiclePayload,
            location: { coordinates: location, address: form.address },
            locationConsent: consent,
          },
          token,
        );
        setTrackId(res.job?.id ?? null);
        setResult(
          `Job created. ${res.dispatch?.candidatesNotified ?? 0} nearby provider(s) notified. ` +
            `You'll pay £${quote?.total} upfront once a provider accepts.`,
        );
      } else {
        setResult(
          `Request prepared. In the live app you'd sign in, pay the £${quote?.total} call-out fee, ` +
            `and we'd instantly dispatch this ${service} job to the nearest available provider — ` +
            `then you'd track them in on a live map.`,
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-6">
        {/* Service choice */}
        <fieldset className="grid gap-3">
          <legend className="eyebrow mb-2">1. What do you need?</legend>
          {SERVICES.map((s) => (
            <label
              key={s.type}
              className={`card flex cursor-pointer items-start gap-3 ${
                service === s.type ? 'ring-2 ring-secondary' : ''
              }`}
            >
              <input
                type="radio"
                name="service"
                value={s.type}
                checked={service === s.type}
                onChange={() => setService(s.type)}
                className="mt-1.5"
              />
              <span className="flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-bold text-forest">{s.name}</span>
                  <span className="price-tag">£{s.price}</span>
                </span>
                <span className="mt-1 block text-sm text-ink/80">{s.blurb}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {/* Vehicle + situation */}
        <fieldset className="card grid gap-4">
          <legend className="eyebrow">2. Your vehicle &amp; situation</legend>

          {/* Confirmed vehicle */}
          {vehicle ? (
            <div className="flex flex-col gap-4 rounded-xl border border-secondary/30 bg-mint-50 p-4 sm:flex-row sm:items-center">
              {vehicle.imageUrl ? (
                // Remote provider image — plain <img> avoids next/image remote config.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vehicle.imageUrl}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="h-24 w-36 shrink-0 rounded-lg border border-trim object-cover"
                />
              ) : (
                <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-lg border border-trim bg-white text-xs text-ink/50">
                  No image
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <PlateBadge reg={vehicle.registration} />
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    Confirmed
                  </span>
                </div>
                <p className="mt-2 text-lg font-bold text-forest">
                  {vehicle.make} {vehicle.model}
                </p>
                <p className="text-sm text-ink/70">
                  {[vehicle.year, vehicle.colour, vehicle.fuelType].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={changeVehicle}
                className="self-start text-sm font-semibold text-secondary underline underline-offset-4 hover:text-forest"
              >
                Change
              </button>
            </div>
          ) : manual ? (
            /* Manual entry */
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <input name="make" placeholder="Make" className="rounded-lg border border-trim px-3 py-2" />
                <input name="model" placeholder="Model" className="rounded-lg border border-trim px-3 py-2" />
                <input name="registration" placeholder="Reg" className="rounded-lg border border-trim px-3 py-2 uppercase" />
              </div>
              <button
                type="button"
                onClick={() => setManual(false)}
                className="justify-self-start text-sm font-semibold text-secondary underline underline-offset-4 hover:text-forest"
              >
                Look up by number plate instead
              </button>
            </div>
          ) : (
            /* Plate lookup */
            <div className="grid gap-3">
              <label htmlFor="plate" className="text-sm font-semibold text-ink/80">
                Enter your number plate and we&apos;ll find your vehicle
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex items-stretch overflow-hidden rounded-lg border-2 border-night bg-accent focus-within:ring-2 focus-within:ring-secondary focus-within:ring-offset-2">
                  <span className="flex items-center bg-[#0a4bc2] px-2 text-xs font-bold text-white">UK</span>
                  <input
                    id="plate"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        runLookup();
                      }
                    }}
                    placeholder="AB12 CDE"
                    aria-label="Number plate"
                    className="w-full bg-accent px-3 py-2.5 font-mono text-lg font-bold uppercase tracking-widest text-night placeholder:text-night/40 focus:outline-none sm:w-40"
                  />
                </div>
                <button type="button" onClick={runLookup} disabled={looking} className="btn-primary sm:w-auto">
                  {looking ? 'Searching…' : 'Find vehicle'}
                </button>
              </div>

              {/* Awaiting confirmation */}
              {found && (
                <div className="mt-1 flex flex-col gap-4 rounded-xl border border-trim bg-white p-4 shadow-card sm:flex-row sm:items-center">
                  {found.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={found.imageUrl}
                      alt={`${found.make} ${found.model}`}
                      className="h-28 w-40 shrink-0 rounded-lg border border-trim object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-40 shrink-0 items-center justify-center rounded-lg border border-trim bg-mint-50 text-xs text-ink/50">
                      No image available
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink/60">Is this your vehicle?</p>
                    <p className="mt-1 text-xl font-bold text-forest">
                      {found.make} {found.model}
                    </p>
                    <p className="mt-1 text-sm text-ink/70">
                      {[found.year, found.colour, found.fuelType].filter(Boolean).join(' · ')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setVehicle(found)} className="btn-primary">
                        Yes, that&apos;s my vehicle
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFound(null);
                          setPlate('');
                        }}
                        className="btn-outline"
                      >
                        No, search again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {lookupError && (
                <p className="text-sm text-red-700" role="alert">
                  {lookupError}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setManual(true);
                  setFound(null);
                  setLookupError(null);
                }}
                className="justify-self-start text-sm font-semibold text-secondary underline underline-offset-4 hover:text-forest"
              >
                Enter vehicle details manually instead
              </button>
            </div>
          )}

          <textarea
            name="description"
            rows={3}
            placeholder="Briefly describe what's happened…"
            className="rounded-lg border border-trim px-3 py-2"
          />
        </fieldset>

        {/* Location + consent */}
        <fieldset className="card grid gap-3">
          <legend className="eyebrow">3. Where are you?</legend>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={useMyLocation} className="btn-outline">
              Use my location
            </button>
            {coords && (
              <span className="text-sm text-secondary">
                Location set ({coords[1].toFixed(4)}, {coords[0].toFixed(4)})
              </span>
            )}
          </div>
          <input
            name="address"
            placeholder="Or describe where you are (road, junction, landmark)…"
            className="rounded-lg border border-trim px-3 py-2"
          />
          <label className="mt-1 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              I consent to sharing my location so an accepted provider can find me. Sharing stops
              automatically once they arrive.
            </span>
          </label>
        </fieldset>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-red-800" role="alert">
            {error}
          </p>
        )}
        {result && (
          <div className="rounded-lg bg-mint-100 px-4 py-3 text-forest" role="status">
            <p>{result}</p>
            {trackId && (
              <Link href={`/jobs/${trackId}`} className="btn-primary mt-3">
                Track your provider
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Live quote summary */}
      <aside className="h-fit card lg:sticky lg:top-24">
        <h2 className="text-xl">Your fixed price</h2>
        {!quote ? (
          <p className="mt-3 text-ink/70">Calculating…</p>
        ) : (
          <>
            <p className="mt-2 text-4xl font-bold text-forest">£{quote.total}</p>
            <p className="text-sm text-ink/70">Call-out fee, paid upfront</p>
            <dl className="mt-4 space-y-1 border-t border-trim pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/70">Provider receives</dt>
                <dd>£{quote.providerNet}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/70">Platform commission (5%)</dt>
                <dd>£{quote.commission}</dd>
              </div>
            </dl>
            <ul className="mt-4 space-y-2 border-t border-trim pt-4 text-sm text-ink/80">
              {quote.notes.map((n, i) => (
                <li key={i}>• {n}</li>
              ))}
            </ul>
          </>
        )}
        <button type="submit" className="btn-primary mt-5 w-full" disabled={submitting}>
          {submitting ? 'Finding help…' : 'Confirm & find a provider'}
        </button>
        <p className="mt-3 text-xs text-ink/60">
          You only pay once a provider accepts. No subscription, no membership.
        </p>
      </aside>
    </form>
  );
}
