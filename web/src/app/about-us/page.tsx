import type { Metadata } from 'next';
import ContentPage from '@/components/ContentPage';
import { pageMetadata } from '@/lib/seo';
import { about } from '@/content/pages';

export const metadata: Metadata = pageMetadata({
  title: about.seo.title,
  description: about.seo.description,
  path: '/about-us',
  ogImage: about.heroImage,
});

export default function AboutPage() {
  return <ContentPage content={about} eyebrow="About us" />;
}
