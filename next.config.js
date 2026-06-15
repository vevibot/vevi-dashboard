const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  // Update strategy: take over old caches immediately so deploys land within
  // ~one page load instead of "next time you open the app". Combined with
  // reloadOnOnline, users get fresh code without manual cache wipes.
  register: true,
  skipWaiting: true,                  // new SW activates immediately, no "waiting" state
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,               // new SW controls already-open tabs without close
    cleanupOutdatedCaches: true,      // delete stale pre-cache entries on activate
    // Force HTML pages to fetch network first (only fall back to cache offline).
    // This is the critical change — pages always check for new build first.
    runtimeCaching: [
      {
        urlPattern: ({ request, url }) =>
          request.mode === 'navigate' && !url.pathname.startsWith('/api/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-network-first',
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
        },
      },
    ],
  },
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
