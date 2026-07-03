import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/lib/seo';
import { products, COMMISSION_RATE, site } from '@/lib/site';

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) return {};
  return pageMetadata({
    title: product.seo.title,
    description: product.seo.description,
    path: `/services/${product.slug}`,
  });
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) notFound();

  const commission = +(product.price * COMMISSION_RATE).toFixed(2);

  // Product structured data
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: product.name,
    description: product.shortDescription,
    provider: { '@type': 'AutomotiveBusiness', name: site.name },
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="container-page py-12">
        <nav className="mb-6 text-sm text-ink/70" aria-label="Breadcrumb">
          <Link href="/services" className="text-secondary underline">
            Services
          </Link>{' '}
          / <span>{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <article>
            <p className="eyebrow">{product.categories.join(' · ')}</p>
            <h1 className="mt-2 text-4xl">{product.name}</h1>
            <p className="mt-4 max-w-prose text-lg text-ink/90">{product.shortDescription}</p>
            <div className="prose-pickle mt-6">
              <p>{product.description}</p>
            </div>
          </article>

          <aside className="h-fit card lg:sticky lg:top-24">
            <p className="text-sm font-semibold text-ink/70">Call-out fee (paid upfront)</p>
            <p className="mt-1 text-4xl font-bold text-forest">£{product.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-ink/90">
              <li>✓ Transparent, fixed upfront price</li>
              <li>✓ Real-time provider tracking</li>
              <li>✓ In-app chat once paid</li>
              <li>✓ No subscription, ever</li>
            </ul>
            <p className="mt-4 border-t border-trim pt-4 text-xs text-ink/70">
              Provider keeps £{(product.price - commission).toFixed(2)} of the call-out fee
              (platform commission £{commission.toFixed(2)} / {COMMISSION_RATE * 100}%). Labour,
              parts and extra mileage are charged separately and are 100% the provider’s.
            </p>
            <Link
              href={{ pathname: '/request-help', query: { service: product.serviceType } }}
              className="btn-primary mt-5 w-full"
            >
              Request this now
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}
