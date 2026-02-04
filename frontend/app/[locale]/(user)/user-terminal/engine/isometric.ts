import { TILE_WIDTH, TILE_HEIGHT } from './config';

// Convertit Grille -> Pixels (Pour dessiner)
export function gridToScreen(x: number, y: number) {
    return {
        x: (x - y) * TILE_WIDTH / 2,
        y: (x + y) * TILE_HEIGHT / 2
    };
}

// Convertit Pixels -> Grille (Pour la souris)
export function screenToGrid(screenX: number, screenY: number) {
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    // Formule mathématique pure de l'isométrie inversée
    // On divise par le demi-largeur/hauteur pour normaliser
    const gridX = (screenX / halfW + screenY / halfH) / 2;
    const gridY = (screenY / halfH - screenX / halfW) / 2;

    // Math.floor est LE standard pour trouver l'index d'une case dans un tableau
    return {
        x: Math.floor(gridX),
        y: Math.floor(gridY)
    };
}