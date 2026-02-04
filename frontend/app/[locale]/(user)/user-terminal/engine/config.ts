// 128x128 est le "Sweet Spot" pour un city builder web performant
export const GRID_SIZE = 128;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// Configuration de l'affichage
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// Zoom par défaut (Réduit pour voir plus de carte)
export const INITIAL_ZOOM = 0.5;

export const RESOURCE_CAPACITY = {
    OIL: 250000, COAL: 50000, IRON: 40000,
    WOOD: 5000, FISH: 15000, ANIMALS: 500, WATER: 1000000,
};

export const RESOURCE_UNITS = {
    OIL: 'bbl', COAL: 't', IRON: 't', WOOD: 'm³', FISH: 'u', ANIMALS: 'têtes', WATER: 'L'
};