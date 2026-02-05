import { MapEngine } from './MapEngine';
import { BuildingData, ZoneType, BUILDING_COSTS, PlayerResources } from './types';
import { GRID_SIZE } from './config';

export class BuildingManager {

    // Vérifie si une tuile touche une route
    static hasRoadAccess(engine: MapEngine, index: number): boolean {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);
        const neighbors = [
            (y > 0) ? (y - 1) * GRID_SIZE + x : -1, // N
            (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1, // S
            (x > 0) ? y * GRID_SIZE + (x - 1) : -1, // W
            (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1 // E
        ];

        // Vérifie si un voisin est une route
        return neighbors.some(n => n !== -1 && engine.roadLayer[n] !== null);
    }

    // Vérifie et consomme les ressources
    static tryConsumeResources(engine: MapEngine, cost: Partial<PlayerResources>): boolean {
        // 1. Vérification
        if ((cost.wood || 0) > engine.resources.wood) return false;
        if ((cost.concrete || 0) > engine.resources.concrete) return false;
        if ((cost.glass || 0) > engine.resources.glass) return false;
        if ((cost.steel || 0) > engine.resources.steel) return false;

        // 2. Consommation
        engine.resources.wood -= (cost.wood || 0);
        engine.resources.concrete -= (cost.concrete || 0);
        engine.resources.glass -= (cost.glass || 0);
        engine.resources.steel -= (cost.steel || 0);

        return true;
    }

    // Appelé à chaque "tick" de simulation pour faire évoluer la ville
    static updateBuildings(engine: MapEngine) {
        // On ne check pas toutes les cases à chaque frame (trop lourd)
        // On check aléatoirement 50 tuiles par tick pour simuler la croissance organique
        for (let i = 0; i < 50; i++) {
            const idx = Math.floor(Math.random() * engine.config.totalCells);
            const zoneType = engine.zoningLayer[idx];
            const building = engine.buildingLayer[idx];

            // Pas de zone, pas de bâtiment
            if (zoneType === ZoneType.NONE) continue;

            // 1. CONSTRUCTION INITIALE (Terrain vide + Zone définie)
            if (!building) {
                if (this.hasRoadAccess(engine, idx)) {
                    // Essayer de construire le niveau 1
                    const cost = BUILDING_COSTS[zoneType][1];
                    if (this.tryConsumeResources(engine, cost)) {
                        engine.buildingLayer[idx] = {
                            type: zoneType,
                            level: 1,
                            state: 'CONSTRUCTION',
                            pollution: 0,
                            happiness: 100,
                            constructionTimer: 0
                        };
                        engine.revision++; // Demande un redessin
                    }
                }
            }
            // 2. ÉVOLUTION (Bâtiment existant)
            else if (building.state === 'ACTIVE' && building.level < 5) {
                // Chance aléatoire d'évoluer si conditions réunies (ici simplifiées)
                if (Math.random() < 0.1) {
                    const nextLevel = building.level + 1;
                    const cost = BUILDING_COSTS[building.type][nextLevel];

                    if (cost && this.tryConsumeResources(engine, cost)) {
                        building.level = nextLevel;
                        building.state = 'CONSTRUCTION'; // Repasse en travaux
                        building.constructionTimer = 0;
                        engine.revision++;
                    }
                }
            }
            // 3. FIN DE CONSTRUCTION
            else if (building.state === 'CONSTRUCTION') {
                building.constructionTimer++;
                if (building.constructionTimer > 60) { // 1 seconde de "travaux"
                    building.state = 'ACTIVE';
                    engine.revision++;
                }
            }
        }
    }
}