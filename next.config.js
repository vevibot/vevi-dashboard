const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: { disableDevLogs: true },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // Rewrite only used in local dev — Cloudflare Pages Functions handle /api/* in production
  ...(process.env.NODE_ENV === 'development' && {
    async rewrites() {
      return [{ source: '/api/:path*', destination: 'http://localhost:8000/:path*' }];
    },
  }),
};

module.exports = withPWA(nextConfig);
