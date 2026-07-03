import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import { pageMetadata } from '@/lib/seo';
import { products } from '@/lib/site';
import { home } from '@/content/pages';

export const metadata: Metadata = pageMetadata({
  title: home.seo.title,
  description: home.seo.description,
  path: '/',
  ogImage: home.heroImage,
});

/** Minimal stroke icons for the feature grid. */
const icons: Record<string, JSX.Element> = {
  wallet: (
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2m0-3v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-3m0 0h-4a2 2 0 1 1 0-4h4Z" />
  ),
  tag: <path d="M20 12V6a2 2 0 0 0-2-2h-6L3 13l8 8 9-9ZM7.5 8.5h.01" />,
  map: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  shield: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Zm-2.5 8.5 2 2 4-4" />,
  chat: <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />,
};

const features = [
  { icon: 'wallet', title: 'Pay-as-you-need', body: 'No subscriptions. Request help only when you need it, at a clear fixed price.' },
  { icon: 'tag', title: 'Fixed, upfront pricing', body: 'See the call-out or recovery fee before you commit. No surprises, no hidden costs.' },
  { icon: 'map', title: 'Real-time tracking', body: 'Follow your provider on a live map with an accurate estimated time of arrival.' },
  { icon: 'bolt', title: 'Instant dispatch', body: 'Your request goes straight to the nearest available provider for a quick response.' },
  { icon: 'shield', title: 'Secure payments', body: 'Payments are processed securely with an automatic, transparent commission split.' },
  { icon: 'chat', title: 'In-app chat', body: 'Talk directly to your mechanic or recovery operator the moment payment is confirmed.' },
];

const stats = [
  { value: '£50', label: 'Roadside call-out' },
  { value: '5%', label: 'Provider commission' },
  { value: '£0', label: 'Monthly fees' },
  { value: 'UK-wide', label: 'Independent providers' },
];

const steps = [
  { n: 1, title: 'Request assistance', body: 'Post your job and pick the service you need — roadside, recovery, or unsure.' },
  { n: 2, title: 'Get a fixed price', body: 'A provider accepts and you pay a clear call-out fee upfront. No membership.' },
  { n: 3, title: 'Track them in', body: 'Watch your provider approach in real time and chat with them directly.' },
  { n: 4, title: 'Back on the road', body: 'A skilled independent professional gets you moving — or recovers you safely.' },
];

export default function HomePage() {
  return (
    <>
      <Hero
        eyebrow="Pay-as-you-go breakdown cover"
        headline="Breakdown help, the moment your motor's in a pickle"
        subheadline="On-demand roadside assistance and recovery from trusted local providers. Fixed prices, live tracking, and no membership to lock you in."
        cta={{ label: 'Get help now', href: '/request-help' }}
        secondaryCta={{ label: 'Explore our services', href: '/services' }}
        image={home.heroImage}
        highlights={['No membership', 'Fixed upfront prices', 'Live tracking & ETA', 'Vetted local providers']}
      />

      {/* Stats band */}
      <section className="border-b border-trim bg-white">
        <div className="container-page grid grid-cols-2 py-8 sm:grid-cols-4 sm:divide-x sm:divide-trim">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`px-4 text-center ${i >= 2 ? 'mt-6 border-t border-trim pt-6 sm:mt-0 sm:border-t-0 sm:pt-0' : ''}`}
            >
              <p className="font-display text-3xl font-extrabold text-forest sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-ink/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="container-page py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Why choose us</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Breakdown help that fits your life</h2>
          <p className="mt-4 text-lg text-ink/70">
            Everything you&apos;d expect from national cover — without the contract, the call centres, or the monthly bill.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card card-hover">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint-100 text-forest">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {icons[f.icon]}
                </svg>
              </span>
              <h3 className="mt-4 text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-ink/75">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services / pricing */}
      <section className="border-y border-trim bg-mint-50 py-16 md:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">Transparent pricing</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Choose the help you need</h2>
              <p className="mt-4 text-lg text-ink/70">
                One clear call-out fee, shown upfront. Labour, parts and extra mileage are agreed transparently with your provider.
              </p>
            </div>
            <Link href="/services" className="btn-outline">
              View all services
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">From breakdown to back on the road</h2>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="card">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary font-display text-lg font-extrabold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-ink/75">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Story */}
      <section className="border-t border-trim bg-white py-16 md:py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-trim shadow-card">
            <Image
              src="/assets/images/adobestock_383182586.webp"
              alt="A mobile mechanic helping a driver at the roadside"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">A fairer model</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Breakdown cover, reimagined around you</h2>
            <p className="mt-5 text-lg text-ink/75">
              We said goodbye to long-term contracts and hello to a model that fits your life. You only pay for
              assistance when you actually need it — transparent, fixed pricing with no surprises, and real-time
              tracking that keeps you informed every step of the way.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/request-help" className="btn-primary">
                Get help now
              </Link>
              <Link href="/about-us" className="btn-outline">
                Our story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Provider CTA band */}
      <section className="container-page py-16 md:py-20">
        <div className="sheen-night relative overflow-hidden rounded-2xl border border-white/10 px-7 py-10 text-white md:px-12 md:py-14">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow eyebrow-light">For providers</p>
              <h2 className="mt-3 text-2xl text-white sm:text-3xl">Are you a mechanic or recovery operator?</h2>
              <p className="mt-3 text-white/80">
                Get national exposure with no advertising fees — just a 5% commission on the call-out or recovery
                fee. Keep 100% of your labour, parts and mileage, and choose the jobs that suit you.
              </p>
            </div>
            <Link href="/for-service-providers" className="btn-accent btn-lg shrink-0">
              Join as a provider
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
