/**
 * Page copy from the brief (website_structure.pages). Long-form body_content is
 * stored as trusted HTML and rendered via <RichText>. SEO values come from each
 * page's page_seo block, falling back to site defaults in the page components.
 */
import type { ContentSection } from '@/components/ContentSections';

export interface PageContent {
  heroHeadline: string;
  heroSubheadline?: string;
  cta?: { label: string; href: string };
  body: string;
  sections?: ContentSection[];
  seo: { title?: string; description?: string };
  heroImage?: string;
}

export const home = {
  heroHeadline: 'Breakdown Assistance When You Need It, No Strings Attached',
  heroSubheadline:
    'Experience the freedom of pay-as-you-go breakdown cover. Immediate help, fixed pricing, and real-time tracking — giving you peace of mind without the commitment.',
  cta: { label: 'Get Started Today – No Membership Required', href: '/request-help' },
  body: `<p><strong>Welcome to In a Pickle Breakdown</strong>, where we redefine breakdown assistance with a flexible, cost-effective approach. Say goodbye to long-term contracts and hello to a model that fits your lifestyle.</p><h2>Why Choose Us?</h2><p>Unlike traditional breakdown services, we offer a <strong>pay-as-you-need model</strong> that ensures you only pay for assistance when necessary. Our transparent, fixed pricing means no surprises, and our real-time tracking keeps you informed every step of the way.</p>`,
  seo: {
    title: 'In a Pickle Breakdown - Affordable On-Demand Assistance',
    description:
      'Experience stress-free, affordable breakdown assistance with In a Pickle. Pay only when you need our on-demand services.',
  },
  heroImage: '/assets/images/adobestock_259920605.webp',
} satisfies PageContent;

export const about = {
  heroHeadline: 'About In a Pickle',
  heroSubheadline: 'Connecting people who need help with the experts who can deliver it.',
  body: `<p><em>In a Pickle</em> was created to fix a simple problem: breakdown support has become too complicated, too expensive, and too restrictive. Drivers are pushed into subscriptions they rarely use, and skilled service providers are expected to work under rigid rules that don’t reflect the reality of their day-to-day work. I wanted to build something different — something fair, transparent, and genuinely useful.</p><p>Our platform connects drivers directly with independent mechanics and recovery operators who are ready to help. No call centres, no long waits, no confusing policies. Just real people, real skills, and real support when it’s needed most. Drivers only pay when they need help, and providers keep full control of their time, their prices, and the jobs they accept — with transparency being the only rule.</p><p>Everything we do is built around simplicity and fairness. Drivers get clear pricing and live updates. Providers get flexibility, freedom, and a steady stream of opportunities without subscriptions or advertising fees. And because we’re independent, we’re free to focus on what actually matters: making sure people get the help they need quickly, safely, and without unnecessary stress.</p><p><em>In a Pickle</em> isn’t just another breakdown service — it’s a modern, practical alternative designed for how people live and work today. Whether you’re a driver stuck at the roadside or a provider looking for a better way to earn, we’re here to make the whole experience smoother, clearer, and more human.</p>`,
  seo: { title: 'About Us', description: 'Discover on-demand breakdown assistance in the UK. Pay only when you need it, without monthly fees.' },
  heroImage: '/assets/images/adobestock_383182586.webp',
} satisfies PageContent;

export const mobileMechanics = {
  heroHeadline: 'Breakdown Help When You Need It',
  heroSubheadline: 'Immediate, affordable assistance without monthly fees. Pay only when you need help.',
  cta: { label: 'Get Immediate Help Now', href: '/request-help' },
  body: `<p><em>In a Pickle</em> offers a simple, flexible, and fair way for drivers to get help when their vehicle breaks down — whether they’re at home, at work, or already out on the road. The service is designed for people who don’t want the cost or commitment of traditional breakdown cover. Instead of paying monthly fees for something they may never use, customers can request help only when they need it, paying a clear, standard call-out fee with no hidden charges or long-term obligations.</p><p>When a customer experiences a breakdown, they can request assistance directly through the <em>In a Pickle</em> app. The process is quick and straightforward: the customer posts the job, describes the issue, and confirms their vehicle details. The system then connects them with local mobile mechanics who are available and able to respond. Mechanics can review the job and choose to accept it. Once a mechanic accepts, the customer pays the standard call-out fee, after which their location is securely shared with the mechanic.</p><p>The call-out fee includes the mechanic’s arrival and an <strong>initial assessment of the situation</strong>, lasting up to 30 minutes. This assessment is designed to help the mechanic understand the likely cause of the problem and suggest the most appropriate pathway forward.</p><p>If it is not immediately clear whether roadside assistance alone will be sufficient, customers are encouraged to select the <strong>“Assistance with Possible Recovery”</strong> option when posting the job. This ensures that only service providers who can offer both roadside assistance and recovery will be matched to the request.</p><p>During the response, the customer can access <strong>live tracking</strong> to see the mechanic’s real-time location and estimated arrival. They can also communicate directly with the mechanic through the <strong>in-app chat</strong> or by calling them if needed.</p><p><em>In a Pickle</em> is built on fairness and transparency. Customers pay only when they need help, and independent mechanics benefit from increased exposure without advertising fees, paying only a small 5% commission on the call-out fee.</p>`,
  sections: [
    { type: 'value_proposition', heading: 'Revolutionising Breakdown Services', content: 'In a world where unexpected vehicle issues can lead to significant stress and financial burden, In a Pickle Breakdown offers a refreshing alternative. Our service reimagines traditional breakdown cover, providing a pay-as-you-need model that ensures you only pay for the services you use. No monthly subscriptions, no hidden costs—just reliable assistance when you need it most.' },
    { type: 'features', heading: 'Why Choose In a Pickle?', content: "We understand that not everyone can justify the ongoing expense of typical breakdown cover. That's why we've created a service that prioritises your needs and budget. With In a Pickle, you gain access to: <ul><li><strong>On-Demand Assistance:</strong> Get help at the click of a button whenever you find yourself stuck on the road.</li><li><strong>Transparent Pricing:</strong> Know the costs upfront, eliminating surprises and ensuring peace of mind.</li><li><strong>Real-Time Tracking:</strong> Monitor the progress of your service provider and know exactly when help will arrive.</li></ul>" },
    { type: 'testimonial', heading: 'Tailored for You', content: 'Our platform is designed with both drivers and service providers in mind. For drivers, this means immediate access to a network of reliable, independent mechanics and recovery operators. For service providers, it offers a flexible and rewarding way to reach new clients, with no costly advertising fees and only a 5% commission on call-out or recovery fees.' },
    { type: 'process', heading: 'How It Works', content: 'Getting back on the road with In a Pickle is simple: <ol><li><strong>Request Assistance:</strong> Use our easy platform to request help, selecting the service you need.</li><li><strong>Receive Confirmation:</strong> You\'ll get instant confirmation of your request with a clear breakdown of costs.</li><li><strong>Track Your Provider:</strong> Use real-time tracking to see when your provider is en route.</li><li><strong>Get Back on the Road:</strong> Our network of skilled professionals works quickly and efficiently to resolve your issue.</li></ol>' },
  ],
  seo: { title: 'Breakdown Assistance - Pay Only When You Need', description: 'Affordable breakdown assistance with no monthly fees. Get help when you need it and pay only for the services used.' },
  heroImage: '/assets/images/adobestock_303430979.webp',
} satisfies PageContent;

export const recovery = {
  heroHeadline: 'Recovery Solved, Wherever You Are',
  heroSubheadline: 'Get back to your day quickly with our on-demand mobile recovery services.',
  cta: { label: 'Request a Mobile Mechanic Now', href: '/request-help' },
  body: `<p><em>In a Pickle</em> offers a swift, dependable, and affordable vehicle recovery service, ideal for drivers who need quick transport for their vehicle from one location to another. Whether you've experienced a breakdown, a minor accident, or simply require your vehicle relocated, our platform connects you with trusted local recovery experts who respond promptly and professionally. Enjoy the freedom of using our service exactly when you need it—with no subscriptions, no long-term commitments, and absolutely no hidden charges.</p><p>Need recovery assistance? Simply request help through the <em>In a Pickle</em> app. Our user-friendly process makes it easy: post your job, select a recovery option, and provide essential vehicle and situation details. Our system will connect you with available local recovery operators ready to assist.</p><p>Experience peace of mind with <strong>live tracking</strong> from the moment your request is accepted. Track the operator’s real-time location and estimated time of arrival, reducing stress and uncertainty, especially if you're in an unfamiliar area.</p><p>After securing your vehicle, it will be transported to a location <strong>within 10 miles</strong> of the pick-up point. You'll also be taken to a <strong>safe place</strong> away from immediate danger. If your destination exceeds <strong>10 miles</strong>, an additional mileage fee may apply, which will be clearly communicated before continuing the journey.</p><p>For independent recovery operators, <em>In a Pickle</em> provides increased visibility without advertising costs. Operators pay just a modest 5% commission on the recovery fee, keeping additional labour and service earnings entirely theirs.</p>`,
  sections: [
    { type: 'value_proposition', heading: 'Experience Seamless Vehicle Assistance', content: "At In a Pickle Breakdown, we understand the inconvenience of car troubles. That's why our mobile mechanic services are designed to bring expert vehicle repairs directly to you, offering a convenient and cost-effective alternative to traditional garages." },
    { type: 'features', heading: 'Why Choose Our Mobile Mechanics?', content: "Our mobile mechanic services are not just about fixing cars; they're about providing peace of mind:<ul><li><strong>Convenience:</strong> We come to you, wherever you are.</li><li><strong>Transparent Pricing:</strong> Fixed prices upfront, with no hidden fees.</li><li><strong>Expert Technicians:</strong> Vetted professionals, ensuring high-quality service.</li><li><strong>Real-Time Tracking:</strong> Know exactly when your mechanic will arrive.</li><li><strong>Pay-As-You-Go:</strong> Only pay for the services you need.</li></ul>" },
    { type: 'features', heading: 'Our Comprehensive Services', content: 'Our mobile mechanics offer a wide range of services:<ul><li><strong>Vehicle Diagnostics</strong></li><li><strong>Brake Repairs</strong></li><li><strong>Battery Replacements</strong></li><li><strong>General Maintenance</strong></li><li><strong>Emergency Call-Outs</strong></li></ul>' },
    { type: 'testimonial', heading: 'Join Our Network of Satisfied Customers', content: 'We pride ourselves on our growing community of satisfied customers who have experienced the benefits of our mobile mechanic services. Join the countless drivers who have discovered a more efficient way to manage their vehicle maintenance and repairs.' },
  ],
  seo: { title: 'Mobile Recovery Services - On-Demand Car Repairs', description: 'Discover on-demand breakdown assistance in the UK. Pay only when you need it, without monthly fees.' },
  heroImage: '/assets/images/adobestock_521931702.webp',
} satisfies PageContent;

export const providers = {
  heroHeadline: 'Why join In a Pickle?',
  heroSubheadline: 'No subscriptions, no pressure — just real jobs and fair earnings when you want them.',
  cta: { label: 'Become a Provider', href: '/contact-us' },
  body: `<p>If you’re a mobile mechanic, technician, or recovery operator, <em>In a Pickle</em> is built to work for you — not against you. I’ve designed this platform to give you access to real customers, real jobs, and real income without the usual barriers, subscriptions, or advertising costs that cut into your earnings. You stay in full control of your workload, your pricing, and your availability.</p><p>When you join the platform, you’ll create a profile, upload your documents, and once you’re approved, you can start taking jobs straight away. There’s no need to set working hours or commit to fixed schedules — you simply switch your status <strong>Online</strong> when you’re available and <strong>Offline</strong> when you’re not.</p><p>As jobs appear in your area, you’ll see exactly what the customer needs — <strong>whether it’s breakdown assistance or full recovery</strong>. You decide which jobs to accept based on what suits you. There are no penalties for declining, no minimum requirements, and no restrictions.</p><p>When you accept a job, the customer pays the call-out or recovery fee upfront. Only after payment is confirmed do you receive their exact location. This protects your time and ensures you’re never travelling out for free. From that moment, you can track the customer’s location, message them through the in-app chat, or call them if needed.</p><p>One of the biggest advantages for you is that <em>In a Pickle</em> gives you <strong>national exposure without any advertising fees</strong>. You don’t pay to appear on the platform. You don’t pay for leads. You only pay a small 5% commission on the call-out or recovery fee — and that’s it. All labour, parts, extended mileage, and follow-on work remain 100% yours.</p><p>If you’re looking for a platform that respects your time, values your skills, and lets you keep the majority of what you earn, <em>In a Pickle</em> is built for you.</p>`,
  seo: { title: 'For Service Providers', description: 'Join In a Pickle — national exposure, no advertising fees, only 5% commission on the call-out or recovery fee. Keep your labour, parts and mileage.' },
  heroImage: '/assets/images/adobestock_2001315872.webp',
} satisfies PageContent;

export const contact = {
  heroHeadline: 'In a Pickle? Let us help',
  cta: { label: 'Send us a message', href: '#contact-form' },
  body: `<p>If you’ve got a question about the platform, want to give feedback, or need help with something specific, just reach out. We’re here to support both customers and service providers, and we’ll always do our best to respond quickly and clearly. Whether it’s a technical issue, a query about a job, or you simply want to understand how something works, drop us a message and we’ll take it from there. Your experience matters, and every bit of feedback helps us make <em>In a Pickle</em> even better.</p>`,
  seo: { title: 'Contact Us', description: 'Get in touch with In a Pickle Breakdown. Questions, feedback, or support for customers and service providers.' },
} satisfies PageContent;

export const services = {
  heroHeadline: 'Breakdown Assistance, On Your Terms',
  heroSubheadline: 'Flexible, affordable breakdown services without the monthly fees. Pay only when you need us.',
  cta: { label: 'Get Assistance Now', href: '/request-help' },
  body: `<p>When your motor lets you down, <em>In a Pickle</em> is the fast, fair and friendly way to get help without the cost or commitment of traditional breakdown cover. Our Roadside Assistance service is designed for real people facing real pressures — especially at a time when the rising cost of living makes monthly breakdown subscriptions feel like a luxury rather than a necessity. Instead of paying every month for something you may never use, you simply request help when you need it, at a clear, fixed price you see upfront.</p><p>When a driver requests assistance, a trusted local mechanic or recovery operator is dispatched directly to their location. Upon arrival, the mechanic begins with a <strong>comprehensive visual inspection</strong> of the vehicle. This initial assessment helps determine whether the vehicle can be safely repaired at the roadside or whether recovery is the safest option. If you're unsure whether you need roadside assistance or recovery, we have an option for that.</p><p>One of the core values of <em>In a Pickle</em> is fairness — not just for drivers, but for the independent mechanics and recovery operators who keep the service running. Providers only pay a low 5% commission on the call-out or recovery fee, and their labour rates and parts costs remain completely untouched.</p>`,
  sections: [
    { type: 'value_proposition', heading: 'Why Choose In a Pickle?', content: "At In a Pickle, we understand the frustration of unexpected vehicle breakdowns and the financial burden of traditional breakdown cover. That's why we've revolutionised the way drivers receive assistance. With our pay-as-you-need model, you have the freedom to call for help whenever and only when you need it." },
    { type: 'features', heading: 'Our Comprehensive Services', content: 'In a Pickle provides a wide range of services to ensure you’re never left stranded:<ul><li><strong>On-Demand Breakdown Assistance</strong></li><li><strong>Mobile Mechanic Services</strong></li><li><strong>Vehicle Diagnostics</strong></li><li><strong>Emergency Call-Outs</strong></li><li><strong>Recovery Transport</strong></li></ul>' },
    { type: 'features', heading: 'Transparent and Upfront Pricing', content: 'We believe in transparency and fairness. Our platform provides clear, upfront pricing before you commit to any service, so there are no surprises. You can track your service provider in real time, knowing exactly when help will arrive.' },
    { type: 'value_proposition', heading: 'Supporting Independent Service Providers', content: 'In a Pickle is proud to support small, independent businesses across the UK. Our model charges only a 5% commission on call-out or recovery fees, allowing these businesses to thrive without the burden of advertising costs.' },
  ],
  seo: { title: 'On-Demand Breakdown Assistance | In a Pickle Breakdown', description: 'Get fast, fair on-demand breakdown assistance with no monthly fees. Stay stress-free and save with In a Pickle. Request help now!' },
  heroImage: '/assets/images/adobestock_264429995.webp',
} satisfies PageContent;

/** FAQ items parsed from the brief's body_content. */
export const faqItems: { q: string; a: string }[] = [
  { q: 'How does In a Pickle work?', a: 'Whether you’re a customer needing help or a provider offering it, everything starts in the app. Customers post a job, and providers see it instantly when they’re Online. Providers choose whether to accept, and customers get real-time updates from there.' },
  { q: 'What happens when a customer posts a job?', a: 'Customers choose between Roadside Assistance, Recovery, or Roadside but Possible Recovery. This gives providers a clear idea of what might be needed. The “Roadside but Possible Recovery” option gives providers who can accommodate both roadside assistance and recovery the opportunity to attend.' },
  { q: 'How do providers receive jobs?', a: 'Providers simply switch Online to appear available. Jobs in their area appear instantly, and they choose which ones to accept.' },
  { q: 'When does the customer pay?', a: 'Customers pay the call-out or recovery fee upfront when a provider accepts the job. This protects the provider’s time and confirms the customer’s commitment.' },
  { q: 'What happens after payment?', a: 'The provider receives the customer’s exact location and can contact them via chat or phone. Customers can track the provider’s arrival in real time.' },
  { q: 'What happens on a Roadside Assistance job?', a: 'Providers attend the customer and carry out an initial assessment (up to 30 minutes) to identify the likely issue and next steps. If more work is needed, the provider charges their own rates — the only rule is that pricing must be transparent.' },
  { q: 'What happens on a Recovery job?', a: 'Providers load the vehicle safely and recover it to a location within 10 miles of the pick-up point. If the customer needs to go further, the provider may charge additional mileage at their own transparent rate.' },
  { q: 'What if the customer isn’t sure what they need?', a: 'They select Roadside but Possible Recovery. This gives providers who can handle both roadside assistance and recovery the opportunity to attend, ensuring the customer gets the right support without delay.' },
  { q: 'How much does In a Pickle cost?', a: 'For customers: you only pay when you need help — no subscriptions, no hidden fees. For providers: no subscriptions, no advertising costs, no lead fees — only a 5% commission on the call-out or recovery fee. All labour, parts, and additional mileage are 100% yours.' },
  { q: 'Do providers have to accept every job?', a: 'No. Providers choose what suits them. There are no penalties for declining.' },
  { q: 'How do providers get paid?', a: 'Call-out and recovery fees are handled automatically through the platform. Any additional labour or mileage is paid directly by the customer to the provider.' },
  { q: 'Can customers and providers communicate?', a: 'Yes — through in-app chat or phone. This keeps everyone informed, safe, and on the same page.' },
];
