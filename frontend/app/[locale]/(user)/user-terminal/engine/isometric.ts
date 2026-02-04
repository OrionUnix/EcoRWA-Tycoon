import { TILE_WIDTH, TILE_HEIGHT } from './config';

// Convertit Grille -> Écran (Pour dessiner les tuiles)
export function gridToScreen(x: number, y: number) {
    return {
        x: (x - y) * TILE_WIDTH / 2,
        y: (x + y) * TILE_HEIGHT / 2
    };
}

// Convertit Écran -> Grille (Pour détecter la souris)
export function screenToGrid(screenX: number, screenY: number) {
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    // Formule inverse précise
    // On ajoute un petit offset (+0.5) pour compenser les arrondis de bordure
    const gridX = (screenX / halfW + screenY / halfH) / 2;
    const gridY = (screenY / halfH - screenX / halfW) / 2;

    return {
        x: Math.floor(gridX),
        y: Math.floor(gridY)
    };
}