import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // L'ajout du type NextConfig au-dessus valide que 'export' est correct
  output: 'export', 
  
  // GitHub Pages nécessite le nom du repo dans le path
  basePath: isProd ? '/EcoRWA-Tycoon' : '',
  assetPrefix: isProd ? '/EcoRWA-Tycoon/' : '', 
  
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);