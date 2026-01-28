/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/EcoRWA-Tycoon',
  assetPrefix: '/EcoRWA-Tycoon/',
  trailingSlash: true,
};

export default nextConfig;