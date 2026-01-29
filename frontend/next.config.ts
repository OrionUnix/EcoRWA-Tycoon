/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: false,
  output: 'export', // Toujours en export pour GitHub Pages
  images: {
    unoptimized: true,
  },
  // On ne met le préfixe QUE si on est en prod
  basePath: isProd ? '/EcoRWA-Tycoon' : '',
  // AssetPrefix doit correspondre au basePath sans le slash final si possible
  assetPrefix: isProd ? '/EcoRWA-Tycoon' : '', 
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

export default withNextIntl(nextConfig);