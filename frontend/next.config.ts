/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
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

export default nextConfig;