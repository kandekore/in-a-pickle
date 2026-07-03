import type { Metadata } from 'next';
import ContentPage from '@/components/ContentPage';
import { pageMetadata } from '@/lib/seo';
import { recovery } from '@/content/pages';

export const metadata: Metadata = pageMetadata({
  title: recovery.seo.title,
  description: recovery.seo.description,
  path: '/mobile-mechanic-services',
  ogImage: recovery.heroImage,
});

export default function RecoveryServicesPage() {
  return <ContentPage content={recovery} eyebrow="Recovery Services" />;
}
