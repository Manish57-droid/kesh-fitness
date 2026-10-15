/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep visited admin pages in the browser for 3 minutes so going back to one is instant.
    // A kept copy is refreshed in the background (components/admin/RefreshIfStale.tsx).
    staleTimes: { dynamic: 180, static: 300 },
  },
};
module.exports = nextConfig;
