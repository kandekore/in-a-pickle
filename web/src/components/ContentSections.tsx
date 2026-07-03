import RichText from './RichText';

export interface ContentSection {
  type: string; // value_proposition | features | testimonial | process
  heading: string;
  content: string; // may contain HTML lists
}

/** Renders the brief's per-page `sections` array as alternating cards. */
export default function ContentSections({ sections }: { sections: ContentSection[] }) {
  return (
    <div className="container-page grid gap-6 py-4 md:grid-cols-2">
      {sections.map((s, i) => (
        <article
          key={i}
          className={`card ${i % 3 === 0 ? 'bg-mint-50 md:col-span-2' : ''}`}
        >
          <p className="eyebrow mb-3">{labelFor(s.type)}</p>
          <h2 className="text-2xl">{s.heading}</h2>
          <RichText html={s.content} className="mt-3 max-w-none" />
        </article>
      ))}
    </div>
  );
}

function labelFor(type: string): string {
  switch (type) {
    case 'value_proposition':
      return 'Why it matters';
    case 'features':
      return 'What you get';
    case 'testimonial':
      return 'For you';
    case 'process':
      return 'How it works';
    default:
      return 'More';
  }
}
