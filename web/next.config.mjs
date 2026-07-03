/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-hosted on a VPS — standalone output keeps the runtime image small.
  output: 'standalone',
  images: {
    // Local WebP assets live under /public/assets; no remote hotlinking.
    formats: ['image/webp'],
  },
};

export default nextConfig;
