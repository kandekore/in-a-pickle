import type { Metadata } from 'next';
import Hero from '@/components/Hero';
import RichText from '@/components/RichText';
import ContactForm from '@/components/ContactForm';
import { pageMetadata } from '@/lib/seo';
import { contact } from '@/content/pages';

export const metadata: Metadata = pageMetadata({
  title: contact.seo.title,
  description: contact.seo.description,
  path: '/contact-us',
});

export default function ContactPage() {
  return (
    <>
      <Hero eyebrow="Contact" headline={contact.heroHeadline} />
      <section className="container-page grid gap-10 py-12 lg:grid-cols-2">
        <div>
          <RichText html={contact.body} />
          <div className="mt-6 card bg-mint-50">
            <h2 className="text-xl">Two ways we help</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-ink/90">
              <li>
                <strong className="text-forest">Drivers:</strong> questions about a job, pricing, or
                tracking.
              </li>
              <li>
                <strong className="text-forest">Providers:</strong> onboarding, documents, payouts,
                and going Online.
              </li>
            </ul>
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
