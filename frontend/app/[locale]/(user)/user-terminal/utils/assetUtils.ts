/**
 * Utilitaires pour la gestion des assets
 * Indispensable pour la compatibilité GitHub Pages (basePath)
 */

const isProd = process.env.NODE_ENV === 'production';
const BASE_PATH = isProd ? '/EcoRWA-Tycoon' : '';

/**
 * Préfixe un chemin d'asset avec le basePath s'il est en production
 * @param path Chemin de l'asset commençant par / (ex: /assets/models/...)
 * @returns Chemin complet avec le préfixe si nécessaire
 */
export function withBasePath(path: string): string {
    if (!path.startsWith('/')) {
        console.warn('withBasePath: le chemin doit commencer par /', path);
        return path;
    }

    // Évite les doubles slashes si BASE_PATH finit par / ou path commence par /
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${BASE_PATH}/${cleanPath}`;
}

/**
 * Alias pour withBasePath
 */
export const asset = withBasePath;
