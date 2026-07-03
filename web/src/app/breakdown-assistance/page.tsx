import type { Metadata } from 'next';
import ContentPage from '@/components/ContentPage';
import { pageMetadata } from '@/lib/seo';
import { mobileMechanics } from '@/content/pages';

export const metadata: Metadata = pageMetadata({
  title: mobileMechanics.seo.title,
  description: mobileMechanics.seo.description,
  path: '/breakdown-assistance',
  ogImage: mobileMechanics.heroImage,
});

export default function MobileMechanicsPage() {
  return <ContentPage content={mobileMechanics} eyebrow="Mobile Mechanics" />;
}
