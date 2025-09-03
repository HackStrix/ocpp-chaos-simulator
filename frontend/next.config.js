/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export', // Static export for Cloudflare Workers
  trailingSlash: true,
  images: {
    unoptimized: true // Required for static export
  },
  // Configure API proxy only for development (rewrites don't work with export)
  ...(process.env.NODE_ENV === 'development' && {
    async rewrites() {
      return [
        {
          source: '/health',
          destination: 'http://localhost:8080/health', // Health check endpoint
        },
        {
          source: '/api/:path*',
          destination: 'http://localhost:8080/api/:path*', // Go backend
        },
        {
          source: '/ws',
          destination: 'http://localhost:8080/ws', // WebSocket endpoint
        },
      ];
    },
  }),
};

module.exports = nextConfig;
