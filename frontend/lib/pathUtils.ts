// Détection propre du mode production ou GitHub Pages
const isProd = process.env.NODE_ENV === 'production';
const isGithubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

const BASE_PATH = (isProd || isGithubPages) ? '/EcoRWA-Tycoon' : '';

export const fixPath = (path: string) => `${BASE_PATH}${path}`;