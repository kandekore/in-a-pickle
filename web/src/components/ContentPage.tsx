import Link from 'next/link';
import Hero from './Hero';
import RichText from './RichText';
import ContentSections from './ContentSections';
import type { PageContent } from '@/content/pages';

/** Standard layout for the brief's content-driven pages. */
export default function ContentPage({
  content,
  eyebrow,
}: {
  content: PageContent;
  eyebrow?: string;
}) {
  return (
    <>
      <Hero
        eyebrow={eyebrow}
        headline={content.heroHeadline}
        subheadline={content.heroSubheadline}
        cta={content.cta}
        image={content.heroImage}
        compact
      />

      <section className="container-page py-14 md:py-16">
        <RichText html={content.body} className="mx-auto" />
      </section>

      {content.sections && content.sections.length > 0 && (
        <ContentSections sections={content.sections} />
      )}

      <section className="container-page pb-20">
        <div className="sheen-night flex flex-col items-start gap-5 overflow-hidden rounded-2xl border border-white/10 px-7 py-9 text-white md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 className="text-2xl text-white">Need help right now?</h2>
            <p className="mt-2 text-white/80">
              See a clear, fixed price upfront and track your provider in real time.
            </p>
          </div>
          <Link href="/request-help" className="btn-accent btn-lg shrink-0">
            {content.cta?.label ?? 'Get help now'}
          </Link>
        </div>
      </section>
    </>
  );
}
