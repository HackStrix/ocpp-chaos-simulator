/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  assetPrefix: '',
  // Configure API proxy for development
  async rewrites() {
    return [
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
};

module.exports = nextConfig;
