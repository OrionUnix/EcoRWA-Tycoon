/**
 * Utilitaires pour la gestion des assets - Compatible Vercel
 *
 * Sur Vercel, les assets sont servis depuis la racine `/` sans préfixe.
 * Cette fonction est un passthrough transparent : elle retourne le chemin tel quel.
 * Tous les appels `withBasePath('/assets/...')` continuent de fonctionner sans modification.
 */

/**
 * Retourne le chemin d'asset tel quel (compatible Vercel).
 * @param path Chemin de l'asset commençant par / (ex: /assets/...)
 * @returns Le même chemin (ex: /assets/...)
 */
export function withBasePath(path: string): string {
    if (!path) return '';
    return path;
}

/**
 * Alias pour withBasePath
 */
export const asset = withBasePath;
