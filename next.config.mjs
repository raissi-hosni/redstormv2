// next.config.mjs  (add these two keys)
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 1. proxy /api  →  localhost:8000  (dev only)
  async rewrites() {
  return [
    { source: '/api/:path*', destination: 'http://localhost:8000/api/:path*' },
    { source: '/ws/:path*',  destination: 'http://localhost:8000/ws/:path*' }  // ← http
  ];
},

  // 2. default env so front builds even if env var missing
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '', // empty → use proxy
  },
};

export default nextConfig;