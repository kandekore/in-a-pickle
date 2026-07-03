import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import { pageMetadata } from '@/lib/seo';
import { faqItems } from '@/content/pages';

export const metadata: Metadata = pageMetadata({
  title: 'FAQ — How It All Works',
  description:
    'Everything you need to know about In a Pickle — whether you’re getting help or giving it. Pricing, payments, tracking, and provider questions answered.',
  path: '/faq',
});

// FAQPage structured data for rich results.
function faqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema()) }}
      />
      <Hero
        eyebrow="FAQ"
        headline="How It All Works"
        subheadline="Everything you need to know — whether you’re getting help or giving it."
      />

      <section className="container-page py-12">
        <div className="mx-auto max-w-3xl divide-y divide-trim">
          {faqItems.map((f, i) => (
            <details key={i} className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-bold text-forest">
                {f.q}
                <span className="text-secondary transition group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="pb-4 text-ink/90">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
