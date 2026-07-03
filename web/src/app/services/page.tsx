import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import RichText from '@/components/RichText';
import ContentSections from '@/components/ContentSections';
import ProductCard from '@/components/ProductCard';
import { pageMetadata } from '@/lib/seo';
import { products } from '@/lib/site';
import { services } from '@/content/pages';

export const metadata: Metadata = pageMetadata({
  title: services.seo.title,
  description: services.seo.description,
  path: '/services',
  ogImage: services.heroImage,
});

export default function ServicesPage() {
  return (
    <>
      <Hero
        eyebrow="Services"
        headline={services.heroHeadline}
        subheadline={services.heroSubheadline}
        cta={services.cta}
        image={services.heroImage}
      />

      <section className="bg-mint-50 py-14">
        <div className="container-page">
          <p className="eyebrow">Pick your service</p>
          <h2 className="mt-2 text-3xl">Clear, fixed prices — see the cost before you commit</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          <p className="mt-6 max-w-prose text-sm text-ink/80">
            The fee shown is the call-out / recovery fee paid upfront. Labour, parts and any extra
            mileage are billed separately by the provider at their own transparent rates — In a
            Pickle only takes a 5% commission on the call-out or recovery fee.
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        <RichText html={services.body} className="mx-auto" />
      </section>

      {services.sections && <ContentSections sections={services.sections} />}
    </>
  );
}
