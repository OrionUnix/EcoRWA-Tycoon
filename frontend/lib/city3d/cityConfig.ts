/**
 * Configuration des zones et du réseau routier
 * CORRIGÉ pour utiliser les modèles PNG Kenney disponibles
 */

export interface ZoneBounds {
    name: string;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    color?: string;
}

export interface RoadConfig {
    cellSize: number;
    streetWidth: number;
    mainRoadWidth: number;
}

// ====================================
// CONFIGURATION DES ZONES
// ====================================

export const ZONE_BOUNDS: Record<string, ZoneBounds> = {
    COMMERCIAL: {
        name: 'Zone Commerciale',
        minX: -10,
        maxX: -2,
        minZ: -8,
        maxZ: 0,
        color: '#3B82F6', // Bleu
    },
    RESIDENTIAL: {
        name: 'Zone Résidentielle',
        minX: -10,
        maxX: -2,
        minZ: 0,
        maxZ: 10,
        color: '#10B981', // Vert
    },
    INDUSTRIAL: {
        name: 'Zone Industrielle',
        minX: -2,
        maxX: 12,
        minZ: -8,
        maxZ: 10,
        color: '#F59E0B', // Orange
    },
};

// ====================================
// CONFIGURATION DES ROUTES
// ====================================

export const ROAD_CONFIG: RoadConfig = {
    cellSize: 2,
    streetWidth: 2,
    mainRoadWidth: 2,
};

// ====================================
// TYPES DE ROUTES DISPONIBLES
// D'après vos fichiers PNG, vous avez:
// - road-straight
// - road-bend (virage 90°)
// - road-curve (virage large)
// - road-crossroad (carrefour 4 directions)
// - road-intersection (T)
// - road-roundabout (rond-point)
// - road-end
// ====================================

export const AVAILABLE_ROAD_TYPES = [
    'straight',
    'bend',
    'curve',
    'crossroad',
    'crossroad-line',
    'crossroad-path',
    'crossroad-barrier',
    'intersection',
    'intersection-line',
    'intersection-path',
    'roundabout',
    'roundabout-barrier',
    'end',
    'end-round',
    'end-barrier',
] as const;

export type RoadType = typeof AVAILABLE_ROAD_TYPES[number];

// ====================================
// BOULEVARDS PRINCIPAUX
// ====================================

export const MAIN_ROADS = {
    // Boulevards horizontaux (axe X)
    NORTH_BOULEVARD: { axis: 'x' as const, position: -8, from: -12, to: 12 },
    SOUTH_BOULEVARD: { axis: 'x' as const, position: 10, from: -12, to: 12 },
    CENTER_STREET: { axis: 'x' as const, position: 0, from: -12, to: 12 },

    // Rues verticales (axe Z)
    WEST_STREET: { axis: 'z' as const, position: -10, from: -8, to: 10 },
    CENTER_AVENUE: { axis: 'z' as const, position: -2, from: -8, to: 10 },
    EAST_STREET: { axis: 'z' as const, position: 12, from: -8, to: 10 },
};

// ====================================
// ROUTES SECONDAIRES PAR ZONE
// ====================================

export const ZONE_ROADS = {
    COMMERCIAL: [
        { axis: 'x' as const, position: -4, from: -10, to: -2 },
        { axis: 'z' as const, position: -6, from: -8, to: 0 },
    ],

    RESIDENTIAL: [
        { axis: 'x' as const, position: 5, from: -10, to: -2 },
        { axis: 'z' as const, position: -6, from: 0, to: 10 },
    ],

    INDUSTRIAL: [
        { axis: 'x' as const, position: -4, from: -2, to: 12 },
        { axis: 'x' as const, position: 4, from: -2, to: 12 },
        { axis: 'z' as const, position: 4, from: -8, to: 10 },
        { axis: 'z' as const, position: 8, from: -8, to: 10 },
    ],
};

// ====================================
// POINTS D'INTÉRÊT
// ====================================

export const SPECIAL_LOCATIONS = {
    // Rond-points
    ROUNDABOUTS: [
        { x: -2, z: 0, type: 'roundabout-barrier' as RoadType },
    ],

    // Intersections majeures (pour éclairage)
    MAJOR_INTERSECTIONS: [
        { x: -10, z: 0 },
        { x: -2, z: 0 },
        { x: 12, z: 0 },
        { x: -6, z: -4 },
        { x: -6, z: 5 },
        { x: 4, z: -4 },
        { x: 8, z: -4 },
        { x: 4, z: 4 },
        { x: 8, z: 4 },
    ],
};

// ====================================
// UTILITAIRES
// ====================================

/**
 * Vérifie si une coordonnée est dans une zone
 */
export function isInZone(x: number, z: number, zoneName: keyof typeof ZONE_BOUNDS): boolean {
    const zone = ZONE_BOUNDS[zoneName];
    return x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ;
}

/**
 * Obtient la zone correspondant à une coordonnée
 */
export function getZoneAt(x: number, z: number): string | null {
    for (const [name, zone] of Object.entries(ZONE_BOUNDS)) {
        if (isInZone(x, z, name as keyof typeof ZONE_BOUNDS)) {
            return name;
        }
    }
    return null;
}

/**
 * Vérifie si une coordonnée est sur une route
 */
export function isRoad(x: number, z: number): boolean {
    // Vérifier boulevards principaux
    for (const road of Object.values(MAIN_ROADS)) {
        if (road.axis === 'x' && z === road.position && x >= road.from && x <= road.to) {
            return true;
        }
        if (road.axis === 'z' && x === road.position && z >= road.from && z <= road.to) {
            return true;
        }
    }

    // Vérifier routes secondaires
    for (const roads of Object.values(ZONE_ROADS)) {
        for (const road of roads) {
            if (road.axis === 'x' && z === road.position && x >= road.from && x <= road.to) {
                return true;
            }
            if (road.axis === 'z' && x === road.position && z >= road.from && z <= road.to) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Obtient le type d'intersection à une coordonnée
 */
export function getIntersectionType(x: number, z: number): RoadType | null {
    const cellSize = ROAD_CONFIG.cellSize;

    // Vérifier rond-point
    const roundabout = SPECIAL_LOCATIONS.ROUNDABOUTS.find(r => r.x === x && r.z === z);
    if (roundabout) return roundabout.type;

    // Compter les routes qui se croisent
    const hasNorth = isRoad(x, z - cellSize);
    const hasSouth = isRoad(x, z + cellSize);
    const hasWest = isRoad(x - cellSize, z);
    const hasEast = isRoad(x + cellSize, z);

    const connections = [hasNorth, hasSouth, hasWest, hasEast].filter(Boolean).length;

    if (connections === 4) return 'crossroad-path';
    if (connections === 3) return 'intersection';
    if (connections === 2) {
        // Vérifier si c'est un virage ou une ligne droite
        if ((hasNorth && hasSouth) || (hasWest && hasEast)) {
            return null; // Route droite, pas besoin d'intersection
        }
        return 'bend'; // Virage
    }

    return null;
}

/**
 * Génère une grille de visualisation pour debug
 */
export function generateDebugGrid(size: number = 20): void {
    console.log('=== DEBUG GRID ===');
    for (let z = -size; z <= size; z += 2) {
        let line = '';
        for (let x = -size; x <= size; x += 2) {
            const zone = getZoneAt(x, z);
            const road = isRoad(x, z);

            if (road) {
                line += '═';
            } else if (zone === 'COMMERCIAL') {
                line += 'C';
            } else if (zone === 'RESIDENTIAL') {
                line += 'R';
            } else if (zone === 'INDUSTRIAL') {
                line += 'I';
            } else {
                line += '·';
            }
        }
        console.log(line);
    }
}