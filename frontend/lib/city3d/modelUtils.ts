/**
 * Utilitaires pour les modèles 3D GLB
 * Gère le mapping des types vers les fichiers et le preloading
 */

// --- Chemins de base ---
export const MODEL_PATHS = {
    suburban: '/assets/models/suburban',
    commercial: '/assets/models/commercial',
    industrial: '/assets/models/industrial',
    roads: '/assets/models/roads',
} as const;

// --- Mapping des bâtiments résidentiels ---
export const SUBURBAN_MODELS = {
    'house-a': `${MODEL_PATHS.suburban}/building-type-a.glb`,
    'house-b': `${MODEL_PATHS.suburban}/building-type-b.glb`,
    'house-c': `${MODEL_PATHS.suburban}/building-type-c.glb`,
    'house-d': `${MODEL_PATHS.suburban}/building-type-d.glb`,
    'house-e': `${MODEL_PATHS.suburban}/building-type-e.glb`,
    'house-f': `${MODEL_PATHS.suburban}/building-type-f.glb`,
    'house-g': `${MODEL_PATHS.suburban}/building-type-g.glb`,
    'house-h': `${MODEL_PATHS.suburban}/building-type-h.glb`,
    'house-i': `${MODEL_PATHS.suburban}/building-type-i.glb`,
    'house-j': `${MODEL_PATHS.suburban}/building-type-j.glb`,
    'house-k': `${MODEL_PATHS.suburban}/building-type-k.glb`,
    'house-l': `${MODEL_PATHS.suburban}/building-type-l.glb`,
    'tree-large': `${MODEL_PATHS.suburban}/tree-large.glb`,
    'tree-small': `${MODEL_PATHS.suburban}/tree-small.glb`,
    'fence': `${MODEL_PATHS.suburban}/fence.glb`,
    'planter': `${MODEL_PATHS.suburban}/planter.glb`,
} as const;

// --- Mapping des bâtiments commerciaux ---
export const COMMERCIAL_MODELS = {
    'building-a': `${MODEL_PATHS.commercial}/building-a.glb`,
    'building-b': `${MODEL_PATHS.commercial}/building-b.glb`,
    'building-c': `${MODEL_PATHS.commercial}/building-c.glb`,
    'building-d': `${MODEL_PATHS.commercial}/building-d.glb`,
    'building-e': `${MODEL_PATHS.commercial}/building-e.glb`,
    'building-f': `${MODEL_PATHS.commercial}/building-f.glb`,
    'building-g': `${MODEL_PATHS.commercial}/building-g.glb`,
    'building-h': `${MODEL_PATHS.commercial}/building-h.glb`,
    'skyscraper-a': `${MODEL_PATHS.commercial}/building-skyscraper-a.glb`,
    'skyscraper-b': `${MODEL_PATHS.commercial}/building-skyscraper-b.glb`,
    'skyscraper-c': `${MODEL_PATHS.commercial}/building-skyscraper-c.glb`,
    'skyscraper-d': `${MODEL_PATHS.commercial}/building-skyscraper-d.glb`,
    'skyscraper-e': `${MODEL_PATHS.commercial}/building-skyscraper-e.glb`,
    'awning': `${MODEL_PATHS.commercial}/detail-awning.glb`,
    'parasol-a': `${MODEL_PATHS.commercial}/detail-parasol-a.glb`,
} as const;

// --- Mapping des bâtiments industriels ---
export const INDUSTRIAL_MODELS = {
    'factory-a': `${MODEL_PATHS.industrial}/building-a.glb`,
    'factory-b': `${MODEL_PATHS.industrial}/building-b.glb`,
    'factory-c': `${MODEL_PATHS.industrial}/building-c.glb`,
    'factory-d': `${MODEL_PATHS.industrial}/building-d.glb`,
    'factory-e': `${MODEL_PATHS.industrial}/building-e.glb`,
    'factory-f': `${MODEL_PATHS.industrial}/building-f.glb`,
    'warehouse-a': `${MODEL_PATHS.industrial}/building-g.glb`,
    'warehouse-b': `${MODEL_PATHS.industrial}/building-h.glb`,
    'chimney-large': `${MODEL_PATHS.industrial}/chimney-large.glb`,
    'chimney-medium': `${MODEL_PATHS.industrial}/chimney-medium.glb`,
    'tank': `${MODEL_PATHS.industrial}/detail-tank.glb`,
} as const;

// --- Mapping des routes complet ---
export const ROAD_MODELS = {
    // --- SEGMENTS DE BASE ---
    'straight': `${MODEL_PATHS.roads}/road-straight.glb`,
    'straight-barrier': `${MODEL_PATHS.roads}/road-straight-barrier.glb`,
    'straight-barrier-half': `${MODEL_PATHS.roads}/road-straight-barrier-half.glb`,
    'straight-barrier-end': `${MODEL_PATHS.roads}/road-straight-barrier-end.glb`,
    'straight-half': `${MODEL_PATHS.roads}/road-straight-half.glb`,
    'square': `${MODEL_PATHS.roads}/road-square.glb`,
    'square-barrier': `${MODEL_PATHS.roads}/road-square-barrier.glb`,

    // --- VIRAGES (BENDS & CURVES) ---
    'bend': `${MODEL_PATHS.roads}/road-bend.glb`,
    'bend-barrier': `${MODEL_PATHS.roads}/road-bend-barrier.glb`,
    'bend-sidewalk': `${MODEL_PATHS.roads}/road-bend-sidewalk.glb`,
    'bend-square': `${MODEL_PATHS.roads}/road-bend-square.glb`,
    'bend-square-barrier': `${MODEL_PATHS.roads}/road-bend-square-barrier.glb`,
    'curve': `${MODEL_PATHS.roads}/road-curve.glb`,
    'curve-barrier': `${MODEL_PATHS.roads}/road-curve-barrier.glb`,
    'curve-pavement': `${MODEL_PATHS.roads}/road-curve-pavement.glb`,

    // --- INTERSECTIONS & CROSSROADS ---
    'intersection': `${MODEL_PATHS.roads}/road-intersection.glb`,
    'intersection-barrier': `${MODEL_PATHS.roads}/road-intersection-barrier.glb`,
    'intersection-line': `${MODEL_PATHS.roads}/road-intersection-line.glb`,
    'intersection-path': `${MODEL_PATHS.roads}/road-intersection-path.glb`,
    'crossroad': `${MODEL_PATHS.roads}/road-crossroad.glb`,
    'crossroad-barrier': `${MODEL_PATHS.roads}/road-crossroad-barrier.glb`,
    'crossroad-line': `${MODEL_PATHS.roads}/road-crossroad-line.glb`,
    'crossroad-path': `${MODEL_PATHS.roads}/road-crossroad-path.glb`,
    'curve-intersection': `${MODEL_PATHS.roads}/road-curve-intersection.glb`,
    'curve-intersection-barrier': `${MODEL_PATHS.roads}/road-curve-intersection-barrier.glb`,
    'roundabout': `${MODEL_PATHS.roads}/road-roundabout.glb`,
    'roundabout-barrier': `${MODEL_PATHS.roads}/road-roundabout-barrier.glb`,
    'split': `${MODEL_PATHS.roads}/road-split.glb`,
    'split-barrier': `${MODEL_PATHS.roads}/road-split-barrier.glb`,

    // --- ENTRÉES, SORTIES & BORDURES ---
    'side': `${MODEL_PATHS.roads}/road-side.glb`,
    'side-barrier': `${MODEL_PATHS.roads}/road-side-barrier.glb`,
    'side-entry': `${MODEL_PATHS.roads}/road-side-entry.glb`,
    'side-entry-barrier': `${MODEL_PATHS.roads}/road-side-entry-barrier.glb`,
    'side-exit': `${MODEL_PATHS.roads}/road-side-exit.glb`,
    'side-exit-barrier': `${MODEL_PATHS.roads}/road-side-exit-barrier.glb`,
    'driveway-single': `${MODEL_PATHS.roads}/road-driveway-single.glb`,
    'driveway-single-barrier': `${MODEL_PATHS.roads}/road-driveway-single-barrier.glb`,
    'driveway-double': `${MODEL_PATHS.roads}/road-driveway-double.glb`,
    'driveway-double-barrier': `${MODEL_PATHS.roads}/road-driveway-double-barrier.glb`,

    // --- EXTRÉMITÉS (ENDS) ---
    'end': `${MODEL_PATHS.roads}/road-end.glb`,
    'end-barrier': `${MODEL_PATHS.roads}/road-end-barrier.glb`,
    'end-round': `${MODEL_PATHS.roads}/road-end-round.glb`,
    'end-round-barrier': `${MODEL_PATHS.roads}/road-end-round-barrier.glb`,

    // --- PENTES & PONTS (SLANTS & BRIDGES) ---
    'slant': `${MODEL_PATHS.roads}/road-slant.glb`,
    'slant-barrier': `${MODEL_PATHS.roads}/road-slant-barrier.glb`,
    'slant-high': `${MODEL_PATHS.roads}/road-slant-high.glb`,
    'slant-high-barrier': `${MODEL_PATHS.roads}/road-slant-high-barrier.glb`,
    'slant-flat': `${MODEL_PATHS.roads}/road-slant-flat.glb`,
    'slant-flat-high': `${MODEL_PATHS.roads}/road-slant-flat-high.glb`,
    'slant-curve': `${MODEL_PATHS.roads}/road-slant-curve.glb`,
    'slant-curve-barrier': `${MODEL_PATHS.roads}/road-slant-curve-barrier.glb`,
    'slant-flat-curve': `${MODEL_PATHS.roads}/road-slant-flat-curve.glb`,
    'bridge': `${MODEL_PATHS.roads}/road-bridge.glb`,
    'bridge-pillar': `${MODEL_PATHS.roads}/bridge-pillar.glb`,
    'bridge-pillar-wide': `${MODEL_PATHS.roads}/bridge-pillar-wide.glb`,

    // --- ÉCLAIRAGE (LIGHTS) ---
    'light-curved': `${MODEL_PATHS.roads}/light-curved.glb`,
    'light-curved-double': `${MODEL_PATHS.roads}/light-curved-double.glb`,
    'light-curved-cross': `${MODEL_PATHS.roads}/light-curved-cross.glb`,
    'light-square': `${MODEL_PATHS.roads}/light-square.glb`,
    'light-square-double': `${MODEL_PATHS.roads}/light-square-double.glb`,
    'light-square-cross': `${MODEL_PATHS.roads}/light-square-cross.glb`,

    // --- DÉCORS & SIGNALISATION ---
    'crossing': `${MODEL_PATHS.roads}/road-crossing.glb`,
    'construction-barrier': `${MODEL_PATHS.roads}/construction-barrier.glb`,
    'construction-cone': `${MODEL_PATHS.roads}/construction-cone.glb`,
    'construction-light': `${MODEL_PATHS.roads}/construction-light.glb`,
    'sign-highway': `${MODEL_PATHS.roads}/sign-highway.glb`,
    'sign-highway-detailed': `${MODEL_PATHS.roads}/sign-highway-detailed.glb`,
    'sign-highway-wide': `${MODEL_PATHS.roads}/sign-highway-wide.glb`,
    'tile-high': `${MODEL_PATHS.roads}/tile-high.glb`,
    'tile-low': `${MODEL_PATHS.roads}/tile-low.glb`,
    'tile-slant': `${MODEL_PATHS.roads}/tile-slant.glb`,
    'tile-slant-high': `${MODEL_PATHS.roads}/tile-slantHigh.glb`,
} as const;

// --- Fonction de conversion coordonnées grille -> position 3D ---
export function gridToPosition(
    col: number,
    row: number,
    cellSize: number = 2
): [number, number, number] {
    return [col * cellSize, 0, row * cellSize];
}

// --- Fonction de conversion lettre-chiffre -> position 3D ---
export function coordToPosition(
    coord: string,
    gridOffset: number = 5,
    cellSize: number = 2
): [number, number, number] {
    if (!coord || coord.length < 2) return [0, 0, 0];
    const letters = "ABCDEFGHIJ";
    const col = letters.indexOf(coord[0].toUpperCase());
    const row = parseInt(coord.substring(1)) - 1;
    return [
        (col - gridOffset) * cellSize + 1,
        0,
        (row - gridOffset) * cellSize + 1
    ];
}

// --- Preload des modèles critiques ---
export function getModelsToPreload(): string[] {
    return [
        COMMERCIAL_MODELS['skyscraper-a'],
        COMMERCIAL_MODELS['building-a'],
        SUBURBAN_MODELS['house-a'],
        INDUSTRIAL_MODELS['factory-a'],
        ROAD_MODELS['straight'],
        ROAD_MODELS['crossroad'],
    ];
}
