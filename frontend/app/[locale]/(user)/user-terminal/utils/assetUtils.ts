/**
 * Utilitaires pour la gestion des assets
 * Indispensable pour la compatibilité GitHub Pages (basePath)
 */

// Détection de l'environnement de production (GitHub Pages)
// On vérifie NODE_ENV ou si l'on est dans l'environnement Browser de production
const isProd = process.env.NODE_ENV === 'production';

// Modifiez '/EcoRWA-Tycoon' par le nom exact de votre dépôt GitHub
const REPO_NAME = '/EcoRWA-Tycoon';
const BASE_PATH = isProd ? REPO_NAME : '';

/**
 * Préfixe un chemin d'asset avec le basePath si nécessaire.
 * @param path Chemin de l'asset commençant par / (ex: /assets/...)
 * @returns Chemin complet (ex: /EcoRWA-Tycoon/assets/... en prod, /assets/... en dev)
 */
export function withBasePath(path: string): string {
    // Sécurité : si le chemin est vide ou null
    if (!path) return '';

    // Si on est en local (BASE_PATH vide), on retourne le chemin tel quel
    if (!isProd) {
        return path;
    }

    // En production, on nettoie pour éviter les doubles slashes
    // On s'assure que le path commence par un seul /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Si BASE_PATH est déjà inclus (cas de ré-appel accidentel), on ne l'ajoute pas
    if (normalizedPath.startsWith(BASE_PATH)) {
        return normalizedPath;
    }

    return `${BASE_PATH}${normalizedPath}`;
}

/**
 * Alias pour withBasePath
 */
export const asset = withBasePath;