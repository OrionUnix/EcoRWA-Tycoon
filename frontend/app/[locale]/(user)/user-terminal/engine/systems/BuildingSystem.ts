import { GridConfig, BuildingData, ZoneType, BUILDING_COSTS, PlayerResources, RoadData } from '../types';
import { GRID_SIZE } from '../config';

/**
 * BuildingSystem - Gestion des Bâtiments
 * Gère: Construction, évolution (upgrade), consommation ressources
 */
export class BuildingSystem {

    /**
     * Simulation des bâtiments (à appeler à chaque tick)
     * Gère la construction, le leveling up, etc.
     */
    static updateBuildings(
        config: GridConfig,
        zoningLayer: ZoneType[],
        buildingLayer: (BuildingData | null)[],
        roadLayer: (RoadData | null)[],
        resources: PlayerResources
    ): boolean {
        let hasChanges = false;

        // On check aléatoirement 100 tuiles par tick pour la performance
        const CHECK_COUNT = 100;

        for (let i = 0; i < CHECK_COUNT; i++) {
            const idx = Math.floor(Math.random() * config.totalCells);
            const zoneType = zoningLayer[idx];
            const building = buildingLayer[idx];

            // Pas de zone ou c'est une route = on passe
            if (zoneType === ZoneType.NONE || roadLayer[idx]) continue;

            // 1. CONSTRUCTION INITIALE (Terrain vide + Zone définie)
            if (!building) {
                if (this.hasRoadAccess(idx, roadLayer)) {
                    // Essayer de construire le niveau 1
                    const cost = BUILDING_COSTS[zoneType]?.[1];

                    if (cost && this.tryConsumeResources(resources, cost)) {
                        buildingLayer[idx] = {
                            type: zoneType,
                            level: 1,
                            state: 'CONSTRUCTION',
                            pollution: 0,
                            happiness: 100,
                            constructionTimer: 0
                        };
                        hasChanges = true;
                    }
                }
            }
            // 2. ÉVOLUTION (Bâtiment existant)
            else if (building.state === 'ACTIVE' && building.level < 5) {
                // Chance aléatoire d'évoluer (1% par tick)
                if (Math.random() < 0.01) {
                    const nextLevel = building.level + 1;
                    const cost = BUILDING_COSTS[building.type]?.[nextLevel];

                    if (cost && this.tryConsumeResources(resources, cost)) {
                        building.level = nextLevel;
                        building.state = 'CONSTRUCTION'; // Repasse en travaux
                        building.constructionTimer = 0;
                        hasChanges = true;
                    }
                }
            }
            // 3. FIN DE CONSTRUCTION
            else if (building.state === 'CONSTRUCTION') {
                building.constructionTimer++;
                if (building.constructionTimer > 30) { // ~0.5s à 60fps
                    building.state = 'ACTIVE';
                    hasChanges = true;
                }
            }
        }

        return hasChanges;
    }

    /**
     * Vérifie si une tuile a accès à une route
     */
    private static hasRoadAccess(index: number, roadLayer: (RoadData | null)[]): boolean {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors = [
            (y > 0) ? (y - 1) * GRID_SIZE + x : -1,           // N
            (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1, // S
            (x > 0) ? y * GRID_SIZE + (x - 1) : -1,           // W
            (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1 // E
        ];

        // Vérifie si un voisin est une route
        return neighbors.some(n => n !== -1 && roadLayer[n] !== null);
    }

    /**
     * Vérifie et consomme les ressources
     * @returns true si succès, false si ressources insuffisantes
     */
    private static tryConsumeResources(
        currentResources: PlayerResources,
        cost: Partial<PlayerResources>
    ): boolean {
        // 1. Vérification
        if ((cost.wood || 0) > currentResources.wood) return false;
        if ((cost.concrete || 0) > currentResources.concrete) return false;
        if ((cost.glass || 0) > currentResources.glass) return false;
        if ((cost.steel || 0) > currentResources.steel) return false;
        if ((cost.energy || 0) > currentResources.energy) return false;

        // 2. Consommation (Modification directe du state)
        currentResources.wood -= (cost.wood || 0);
        currentResources.concrete -= (cost.concrete || 0);
        currentResources.glass -= (cost.glass || 0);
        currentResources.steel -= (cost.steel || 0);
        currentResources.energy -= (cost.energy || 0);

        return true;
    }
}
