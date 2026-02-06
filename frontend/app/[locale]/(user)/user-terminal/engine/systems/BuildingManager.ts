import { MapEngine } from '../MapEngine';
import { ZoneType, BUILDING_COSTS, PlayerResources } from '../types';
import { GRID_SIZE } from '../config';

export class BuildingSystem {

    /**
     * Vérifie si une tuile a accès à la route (Nécessaire pour construire)
     */
    static hasRoadAccess(engine: MapEngine, index: number): boolean {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        // Coordonnées des voisins (Nord, Sud, Ouest, Est)
        const neighbors = [
            (y > 0) ? (y - 1) * GRID_SIZE + x : -1,
            (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1,
            (x > 0) ? y * GRID_SIZE + (x - 1) : -1,
            (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1
        ];

        // On regarde si un des voisins est une route
        return neighbors.some(n => n !== -1 && engine.roadLayer[n] !== null);
    }

    /**
     * Tente de consommer des ressources. Renvoie true si succès.
     */
    static tryConsumeResources(engine: MapEngine, cost: Partial<PlayerResources>): boolean {
        // 1. Vérification
        if ((cost.wood || 0) > engine.resources.wood) return false;
        if ((cost.concrete || 0) > engine.resources.concrete) return false;
        if ((cost.glass || 0) > engine.resources.glass) return false;
        if ((cost.steel || 0) > engine.resources.steel) return false;
        if ((cost.money || 0) > engine.resources.money) return false;

        // 2. Consommation
        engine.resources.wood -= (cost.wood || 0);
        engine.resources.concrete -= (cost.concrete || 0);
        engine.resources.glass -= (cost.glass || 0);
        engine.resources.steel -= (cost.steel || 0);
        engine.resources.money -= (cost.money || 0);

        return true;
    }

    /**
     * Appelé par GameEngine toutes les X frames
     */
    static update(engine: MapEngine) {
        // Optimisation : On ne scanne pas toute la map à chaque frame.
        // On prend 50 tuiles au hasard pour simuler une croissance organique.
        for (let i = 0; i < 50; i++) {
            const idx = Math.floor(Math.random() * engine.config.totalCells);
            const zoneType = engine.zoningLayer[idx];
            const building = engine.buildingLayer[idx];

            // Si pas de zone ou si c'est déjà une route, on ignore
            if (zoneType === ZoneType.NONE || engine.roadLayer[idx]) continue;

            // CAS 1 : Terrain vide zoné -> Construction Niveau 1
            if (!building) {
                if (this.hasRoadAccess(engine, idx)) {
                    // Récupère le coût du niveau 1 pour ce type de zone
                    const costs = BUILDING_COSTS[zoneType];
                    const cost = costs ? costs[1] : null;

                    if (cost && this.tryConsumeResources(engine, cost)) {
                        engine.buildingLayer[idx] = {
                            type: zoneType,
                            level: 1,
                            state: 'CONSTRUCTION',
                            pollution: 0,
                            happiness: 100,
                            constructionTimer: 0
                        };
                        engine.revision++; // Signale qu'il faut redessiner
                    }
                }
            }
            // CAS 2 : Bâtiment en construction -> Avance le timer
            else if (building.state === 'CONSTRUCTION') {
                building.constructionTimer++;
                if (building.constructionTimer > 20) { // Durée de construction
                    building.state = 'ACTIVE';
                    engine.revision++;
                }
            }
            // CAS 3 : Bâtiment Actif -> Évolution (Level Up)
            else if (building.state === 'ACTIVE' && building.level < 3) {
                // Faible chance d'évoluer (1/1000) si les conditions sont réunies
                if (Math.random() < 0.001) {
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
        }
    }
}