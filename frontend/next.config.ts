import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // Vercel gère le rendu SSR/SSG nativement.
  // Pas besoin de 'output: export', basePath, assetPrefix ou trailingSlash.
  images: {
    unoptimized: true, // Garder true si les assets sont dans /public (pas de domaine externe)
  },
};

export default withNextIntl(nextConfig);