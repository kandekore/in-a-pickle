/** Single source of truth for business + navigation data (from the brief). */

export const site = {
  name: 'In a Pickle Breakdown',
  shortName: 'In a Pickle',
  tagline: "Here to Help When Your Motor's in a Pickle",
  // picklebreakdown.co.uk is the existing domain in the brief
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://picklebreakdown.co.uk',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  logo: '/assets/brand/logo.webp',
  description:
    'Discover on-demand breakdown assistance in the UK. Pay only when you need it, without monthly fees.',
  fallbackTitle: 'Affordable On-Demand Breakdown Assistance',
  contentLanguage: 'en-GB',
} as const;

export interface NavItem {
  label: string;
  href: string;
}

/** Full navigation from navigation.items in the brief — used by the footer. */
export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about-us' },
  { label: 'Mobile Mechanics', href: '/breakdown-assistance' },
  { label: 'Recovery Services', href: '/mobile-mechanic-services' },
  { label: 'Service Providers', href: '/for-service-providers' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact-us' },
  { label: 'Services', href: '/services' },
];

/**
 * Condensed primary nav for the header — short, single-line labels so the bar
 * never wraps. The remaining destinations live in the footer and on the
 * Services page. Mobile shows the full `navItems` list.
 */
export const primaryNav: NavItem[] = [
  { label: 'Services', href: '/services' },
  { label: 'Mechanics', href: '/breakdown-assistance' },
  { label: 'Recovery', href: '/mobile-mechanic-services' },
  { label: 'For Providers', href: '/for-service-providers' },
  { label: 'About', href: '/about-us' },
  { label: 'Contact', href: '/contact-us' },
];

export interface Product {
  name: string;
  slug: string;
  serviceType: 'roadside' | 'recovery' | 'unsure';
  price: number;
  currency: 'GBP';
  shortDescription: string;
  description: string;
  categories: string[];
  seo: { title: string; description: string; focusKeyword: string };
}

/** Catalogue from products.items (mirrors server/src/data/catalogue.ts). */
export const products: Product[] = [
  {
    name: 'Roadside Assistance',
    slug: 'roadside-assistance',
    serviceType: 'roadside',
    price: 50,
    currency: 'GBP',
    shortDescription:
      'Fast roadside help from trusted local mechanics. Includes a visual inspection and up to 30 minutes of on-scene assistance to get you moving again.',
    description:
      'When your vehicle breaks down, our Roadside Assistance connects you with a trusted local mechanic who comes directly to you. Your mechanic will carry out a visual inspection in an attempt to diagnose the issue, and provide up to 30 minutes of on-scene assistance to get you safely back on the road. If additional labour or parts are needed, your mechanic will explain everything clearly before continuing. This option is ideal when you believe the issue can be fixed at the roadside.',
    categories: ['Automotive Services', 'Roadside Assistance'],
    seo: {
      title: 'Roadside Assistance - Quick Help When You Need It | In a Pickle',
      description:
        'Get fast roadside help with our Roadside Assistance service. Enjoy a flexible, pay-as-you-need model. Choose reliability and affordability today!',
      focusKeyword: 'Roadside Assistance',
    },
  },
  {
    name: 'Recovery',
    slug: 'recovery',
    serviceType: 'recovery',
    price: 80,
    currency: 'GBP',
    shortDescription:
      "If your vehicle can't be fixed at the roadside, choose Recovery for safe transport to a nearby location within 10 miles.",
    description:
      'Our Recovery service is for situations where your vehicle cannot be repaired at the roadside. A recovery operator will collect you and your passengers and take you to a safe location out of immediate danger, whilst transporting your vehicle to a location of your choice within 10 miles of the breakdown point. This option ensures everyone is moved out of danger quickly and safely. It is ideal for breakdowns involving major faults, warning lights, or when the vehicle won’t start at all. If you need to travel beyond 10 miles, any additional mileage costs should be discussed directly with the recovery operator before the journey continues.',
    categories: ['Vehicle Recovery', 'Breakdown Services'],
    seo: {
      title: 'Recovery Service for Safe Vehicle Transport | In a Pickle Breakdown',
      description:
        'Opt for Recovery to transport your vehicle safely within 10 miles. Pay only when you need it. Choose In a Pickle for reliable breakdown support.',
      focusKeyword: 'vehicle recovery service',
    },
  },
  {
    name: 'Unsure (Assistance with Possible Recovery)',
    slug: 'roadside-assistance-but-possible-recovery',
    serviceType: 'unsure',
    price: 100,
    currency: 'GBP',
    shortDescription:
      "Not sure whether you need a mechanic or a tow? Choose this option and we'll send someone who can do both.",
    description:
      'If you’re not sure whether your vehicle can be repaired at the roadside, select Unsure (Assistance with Possible Recovery). Choosing this option sends your job to providers who are equipped to attempt roadside assistance first, and if the vehicle can’t be fixed, they can recover it immediately without needing a second call-out. You’ll only pay the Assistance with Possible Recovery fee upfront, and if recovery isn’t needed, you’ll receive a £50 refund. This option is ideal when you’re unsure what the problem is, or when the vehicle may or may not be safe to drive. Note: the initial visual inspection included in this service is limited to 15 minutes.',
    categories: ['Vehicle Assistance', 'Roadside Recovery'],
    seo: {
      title: 'Unsure (Assistance with Possible Recovery) - In a Pickle Breakdown',
      description:
        'Unsure if you need repair or recovery? Choose Unsure (Assistance with Possible Recovery) for expert help. Get peace of mind today.',
      focusKeyword: 'roadside assistance',
    },
  },
];

export const COMMISSION_RATE = 0.05;
