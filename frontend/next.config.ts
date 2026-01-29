/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
const isProd = process.env.NODE_ENV === 'production';
const withNextIntl = createNextIntlPlugin();
/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  output: isProd ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/EcoRWA-Tycoon' : '',
  assetPrefix: isProd ? '/EcoRWA-Tycoon/' : '',
  trailingSlash: true,
  
  // Suppression de la clé experimental.turbo qui cause l'erreur
  // Turbopack gère désormais nativement les imports de fichiers statiques dans le dossier public
  
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