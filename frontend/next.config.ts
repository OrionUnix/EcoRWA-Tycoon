/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

console.log('--- Next Config ---');
console.log('Environment:', process.env.NODE_ENV);
console.log('isProd:', isProd);
console.log('-------------------');

const nextConfig = {
  output: isProd ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/EcoRWA-Tycoon' : '',
  assetPrefix: isProd ? '/EcoRWA-Tycoon/' : '',
  trailingSlash: true,
  async headers() {
    if (!isProd) {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Cross-Origin-Opener-Policy',
              value: 'same-origin-allow-popups',
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;