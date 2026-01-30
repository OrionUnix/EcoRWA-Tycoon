import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: 'export', 
  

  images: {
    unoptimized: true,
  },

  // Configuration pour GitHub Pages
  basePath: isProd ? '/EcoRWA-Tycoon' : '',
  assetPrefix: isProd ? '/EcoRWA-Tycoon/' : '', 
  
  trailingSlash: true,
};

export default withNextIntl(nextConfig);