import createNextIntlPlugin from 'next-intl/plugin';
/** @type {import('next').NextConfig} */

const withNextIntl = createNextIntlPlugin();
const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'export', 
  // GitHub Pages nécessite le nom du repo dans le path
  basePath: isProd ? '/EcoRWA-Tycoon' : '',
  assetPrefix: isProd ? '/EcoRWA-Tycoon/' : '', 
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Les headers personnalisés ne sont pas autorisés avec output: export
  // GitHub Pages gère lui-même les politiques de sécurité de base
};

export default withNextIntl(nextConfig);