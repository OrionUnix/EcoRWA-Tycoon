/**
 * Visualiseur ASCII du réseau routier
 * Utilise ce script pour visualiser votre layout dans la console
 */

import {
    ZONE_BOUNDS,
    MAIN_ROADS,
    ZONE_ROADS,
    SPECIAL_LOCATIONS,
    isRoad,
    getZoneAt,
    getIntersectionType,
} from './cityConfig';

// Symboles pour la visualisation
const SYMBOLS = {
    ROAD_H: '═',           // Route horizontale
    ROAD_V: '║',           // Route verticale
    INTERSECTION: '╬',     // Carrefour 4 directions
    INTERSECTION_T: '╣',   // Intersection en T
    ROUNDABOUT: '⊙',       // Rond-point
    CORNER: '╔',           // Coin de route
    LIGHT: '💡',          // Lampadaire

    COMMERCIAL: 'C',       // Zone commerciale
    RESIDENTIAL: 'R',      // Zone résidentielle
    INDUSTRIAL: 'I',       // Zone industrielle
    EMPTY: '·',            // Vide

    BUILDING: '▓',         // Bâtiment
    TREE: '🌳',           // Arbre
};

interface VisualizerOptions {
    minX?: number;
    maxX?: number;
    minZ?: number;
    maxZ?: number;
    showZones?: boolean;
    showRoads?: boolean;
    showIntersections?: boolean;
    showLights?: boolean;
    cellSize?: number;
}

/**
 * Génère une visualisation ASCII du réseau routier
 */
export function visualizeRoadNetwork(options: VisualizerOptions = {}): string {
    const {
        minX = -12,
        maxX = 12,
        minZ = -10,
        maxZ = 12,
        showZones = true,
        showRoads = true,
        showIntersections = true,
        showLights = true,
        cellSize = 2,
    } = options;

    const lines: string[] = [];

    // En-tête
    lines.push('═'.repeat(70));
    lines.push('  VISUALISATION DU RÉSEAU ROUTIER');
    lines.push('═'.repeat(70));
    lines.push('');

    // Légende
    lines.push('Légende:');
    lines.push(`  ${SYMBOLS.ROAD_H}  Route horizontale    ${SYMBOLS.ROAD_V}  Route verticale`);
    lines.push(`  ${SYMBOLS.INTERSECTION}  Carrefour            ${SYMBOLS.ROUNDABOUT}  Rond-point`);
    lines.push(`  ${SYMBOLS.LIGHT}  Lampadaire           ${SYMBOLS.COMMERCIAL}  Commercial  ${SYMBOLS.RESIDENTIAL}  Résidentiel  ${SYMBOLS.INDUSTRIAL}  Industriel`);
    lines.push('');

    // Axe X (en haut)
    let header = '     ';
    for (let x = minX; x <= maxX; x += cellSize) {
        const label = x.toString().padStart(3, ' ');
        header += label + ' ';
    }
    lines.push(header);
    lines.push('');

    // Parcourir la grille
    for (let z = minZ; z <= maxZ; z += cellSize) {
        let line = z.toString().padStart(3, ' ') + ' │';

        for (let x = minX; x <= maxX; x += cellSize) {
            let symbol = SYMBOLS.EMPTY;

            // Vérifier les lampadaires
            if (showLights) {
                const hasLight = SPECIAL_LOCATIONS.MAJOR_INTERSECTIONS.some(
                    int => int.x === x && int.z === z
                );
                if (hasLight) {
                    symbol = SYMBOLS.LIGHT;
                    line += ` ${symbol} `;
                    continue;
                }
            }

            // Vérifier les rond-points
            if (showIntersections) {
                const roundabout = SPECIAL_LOCATIONS.ROUNDABOUTS.find(
                    rb => rb.x === x && rb.z === z
                );
                if (roundabout) {
                    symbol = SYMBOLS.ROUNDABOUT;
                    line += ` ${symbol} `;
                    continue;
                }
            }

            // Vérifier les routes
            if (showRoads && isRoad(x, z)) {
                const intersectionType = getIntersectionType(x, z);

                if (showIntersections && intersectionType) {
                    symbol = SYMBOLS.INTERSECTION;
                } else {
                    // Déterminer si route horizontale ou verticale
                    const hasHorizontal = isRoad(x - cellSize, z) || isRoad(x + cellSize, z);
                    const hasVertical = isRoad(x, z - cellSize) || isRoad(x, z + cellSize);

                    if (hasHorizontal && !hasVertical) {
                        symbol = SYMBOLS.ROAD_H;
                    } else if (hasVertical && !hasHorizontal) {
                        symbol = SYMBOLS.ROAD_V;
                    } else if (hasHorizontal && hasVertical) {
                        symbol = SYMBOLS.INTERSECTION;
                    } else {
                        symbol = SYMBOLS.ROAD_H; // Par défaut
                    }
                }

                line += ` ${symbol} `;
                continue;
            }

            // Vérifier les zones
            if (showZones) {
                const zone = getZoneAt(x, z);
                if (zone) {
                    symbol = SYMBOLS[zone as keyof typeof SYMBOLS] || SYMBOLS.EMPTY;
                }
            }

            line += ` ${symbol} `;
        }

        line += '│';
        lines.push(line);
    }

    lines.push('');

    // Statistiques
    lines.push('═'.repeat(70));
    lines.push('Statistiques:');

    let roadCount = 0;
    let intersectionCount = 0;
    let zoneCells = { COMMERCIAL: 0, RESIDENTIAL: 0, INDUSTRIAL: 0 };

    for (let z = minZ; z <= maxZ; z += cellSize) {
        for (let x = minX; x <= maxX; x += cellSize) {
            if (isRoad(x, z)) roadCount++;
            if (getIntersectionType(x, z)) intersectionCount++;

            const zone = getZoneAt(x, z);
            if (zone && zone in zoneCells) {
                zoneCells[zone as keyof typeof zoneCells]++;
            }
        }
    }

    lines.push(`  Routes: ${roadCount} segments`);
    lines.push(`  Intersections: ${intersectionCount}`);
    lines.push(`  Rond-points: ${SPECIAL_LOCATIONS.ROUNDABOUTS.length}`);
    lines.push(`  Lampadaires: ${SPECIAL_LOCATIONS.MAJOR_INTERSECTIONS.length}`);
    lines.push('');
    lines.push('  Zones:');
    lines.push(`    Commercial: ${zoneCells.COMMERCIAL} cellules`);
    lines.push(`    Résidentiel: ${zoneCells.RESIDENTIAL} cellules`);
    lines.push(`    Industriel: ${zoneCells.INDUSTRIAL} cellules`);
    lines.push('═'.repeat(70));

    return lines.join('\n');
}

/**
 * Affiche la visualisation dans la console
 */
export function printRoadNetwork(options?: VisualizerOptions): void {
    console.log(visualizeRoadNetwork(options));
}

/**
 * Génère un rapport détaillé des routes
 */
export function generateRoadReport(): string {
    const lines: string[] = [];

    lines.push('═'.repeat(70));
    lines.push('  RAPPORT DÉTAILLÉ DU RÉSEAU ROUTIER');
    lines.push('═'.repeat(70));
    lines.push('');

    // Boulevards principaux
    lines.push('🛣️  BOULEVARDS PRINCIPAUX:');
    Object.entries(MAIN_ROADS).forEach(([name, road]) => {
        const length = Math.abs(road.to - road.from) / 2;
        lines.push(`  • ${name.padEnd(20)} | ${road.axis === 'x' ? 'Horizontal' : 'Vertical'} | Position: ${road.position} | Longueur: ${length} segments`);
    });
    lines.push('');

    // Routes secondaires par zone
    lines.push('🏘️  ROUTES SECONDAIRES:');
    Object.entries(ZONE_ROADS).forEach(([zone, roads]) => {
        lines.push(`  ${zone}:`);
        roads.forEach((road, i) => {
            const length = Math.abs(road.to - road.from) / 2;
            lines.push(`    ${i + 1}. ${road.axis === 'x' ? 'Horizontal' : 'Vertical'} | Position: ${road.position} | Longueur: ${length} segments`);
        });
    });
    lines.push('');

    // Points spéciaux
    lines.push('🎯  POINTS SPÉCIAUX:');
    lines.push(`  Rond-points: ${SPECIAL_LOCATIONS.ROUNDABOUTS.length}`);
    SPECIAL_LOCATIONS.ROUNDABOUTS.forEach((rb, i) => {
        lines.push(`    ${i + 1}. Position (${rb.x}, ${rb.z}) | Type: ${rb.type}`);
    });
    lines.push('');
    lines.push(`  Intersections majeures: ${SPECIAL_LOCATIONS.MAJOR_INTERSECTIONS.length}`);
    SPECIAL_LOCATIONS.MAJOR_INTERSECTIONS.forEach((int, i) => {
        lines.push(`    ${i + 1}. Position (${int.x}, ${int.z})`);
    });
    lines.push('');

    // Zones
    lines.push('🏢  ZONES:');
    Object.entries(ZONE_BOUNDS).forEach(([name, zone]) => {
        const width = Math.abs(zone.maxX - zone.minX);
        const height = Math.abs(zone.maxZ - zone.minZ);
        const area = width * height / 4; // Divisé par 4 car cellSize = 2
        lines.push(`  ${zone.name}:`);
        lines.push(`    Limites: X[${zone.minX} à ${zone.maxX}], Z[${zone.minZ} à ${zone.maxZ}]`);
        lines.push(`    Dimensions: ${width} × ${height} unités (${area} cellules)`);
    });
    lines.push('');

    lines.push('═'.repeat(70));

    return lines.join('\n');
}

/**
 * Affiche le rapport dans la console
 */
export function printRoadReport(): void {
    console.log(generateRoadReport());
}

/**
 * Export de toutes les données pour debug
 */
export function exportDebugData(): void {
    console.log('📊 EXPORT DES DONNÉES DE DEBUG');
    console.log('');

    console.log('Zone Bounds:', ZONE_BOUNDS);
    console.log('Main Roads:', MAIN_ROADS);
    console.log('Zone Roads:', ZONE_ROADS);
    console.log('Special Locations:', SPECIAL_LOCATIONS);
    console.log('');

    printRoadNetwork();
    console.log('');
    printRoadReport();
}

// Pour utilisation directe dans la console
if (typeof window !== 'undefined') {
    (window as any).visualizeRoads = printRoadNetwork;
    (window as any).roadReport = printRoadReport;
    (window as any).debugRoads = exportDebugData;
}