import type { Metadata } from 'next';
import { Atkinson_Hyperlegible, Sora } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { site } from '@/lib/site';
import { localBusinessSchema } from '@/lib/seo';
import { AuthProvider } from '@/lib/auth';

// Atkinson Hyperlegible is purpose-built for legibility — chosen to support
// the brief's accessibility goal for dyslexic / low-vision / colour-blind users.
// It carries all body copy.
const atkinson = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-atkinson',
  display: 'swap',
});

// Sora is a confident, geometric display face used only for headings — it gives
// the brand a sharp, modern presence without sacrificing body legibility.
const sora = Sora({
  weight: ['600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.fallbackTitle}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  manifest: '/manifest.webmanifest',
  icons: { icon: '/assets/brand/logo.webp' },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#08170e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${atkinson.variable} ${sora.variable}`}>
      <body className="flex min-h-screen flex-col">
        {/* LocalBusiness structured data (seo.schema_type) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-secondary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <AuthProvider>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
