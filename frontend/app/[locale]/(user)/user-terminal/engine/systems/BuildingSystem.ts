import { MapEngine } from '../MapEngine';
// ✅ AJOUT DE BuildingType
import { ZoneType, BuildingType, BUILDING_COSTS, PlayerResources } from '../types';
import { GRID_SIZE } from '../config';

export class BuildingSystem {

    /**
     * Vérifie si une tuile a accès à la route
     */
    static hasRoadAccess(engine: MapEngine, index: number): boolean {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors = [
            (y > 0) ? (y - 1) * GRID_SIZE + x : -1,
            (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1,
            (x > 0) ? y * GRID_SIZE + (x - 1) : -1,
            (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1
        ];

        return neighbors.some(n => n !== -1 && engine.roadLayer[n] !== null);
    }

    /**
     * Tente de consommer des ressources
     */
    static tryConsumeResources(engine: MapEngine, cost: Partial<PlayerResources>): boolean {
        if ((cost.wood || 0) > engine.resources.wood) return false;
        if ((cost.concrete || 0) > engine.resources.concrete) return false;
        if ((cost.glass || 0) > engine.resources.glass) return false;
        if ((cost.steel || 0) > engine.resources.steel) return false;
        if ((cost.money || 0) > engine.resources.money) return false;

        engine.resources.wood -= (cost.wood || 0);
        engine.resources.concrete -= (cost.concrete || 0);
        engine.resources.glass -= (cost.glass || 0);
        engine.resources.steel -= (cost.steel || 0);
        engine.resources.money -= (cost.money || 0);

        return true;
    }

    /**
     * Mise à jour automatique de la croissance de la ville
     */
    static update(engine: MapEngine) {
        // Optimisation : On ne scanne pas toute la map à chaque frame.
        for (let i = 0; i < 50; i++) {
            const idx = Math.floor(Math.random() * engine.config.totalCells);
            const zoneType = engine.zoningLayer[idx];
            const building = engine.buildingLayer[idx];

            // Pas de zone ou déjà une route = on passe
            if (zoneType === ZoneType.NONE || engine.roadLayer[idx]) continue;

            // -------------------------------------------------------
            // CAS 1 : Terrain vide zoné -> On veut construire
            // -------------------------------------------------------
            if (!building) {
                if (this.hasRoadAccess(engine, idx)) {

                    // ✅ 1. CONVERSION ZONE -> BÂTIMENT
                    let targetType: BuildingType;
                    switch (zoneType) {
                        case ZoneType.RESIDENTIAL: targetType = BuildingType.RESIDENTIAL; break;
                        case ZoneType.COMMERCIAL: targetType = BuildingType.COMMERCIAL; break;
                        case ZoneType.INDUSTRIAL: targetType = BuildingType.INDUSTRIAL; break;
                        default: continue; // On ignore les autres zones
                    }

                    // Récupère le coût (si tes coûts sont basés sur BuildingType, utilise targetType ici)
                    // Si BUILDING_COSTS utilise encore ZoneType comme clé, garde zoneType ci-dessous.
                    // Supposons que BUILDING_COSTS utilise ZoneType pour l'instant :
                    const costs = BUILDING_COSTS[zoneType];
                    const cost = costs ? costs[1] : null;

                    if (cost && this.tryConsumeResources(engine, cost)) {

                        // ✅ 2. CRÉATION AVEC LE BON TYPE
                        engine.buildingLayer[idx] = {
                            type: targetType, // C'est ici que ça plantait avant
                            x: idx % GRID_SIZE, // Ajout coord X (souvent requis)
                            y: Math.floor(idx / GRID_SIZE), // Ajout coord Y
                            variant: Math.floor(Math.random() * 3), // Ajout variante visuelle
                            level: 1,
                            state: 'CONSTRUCTION',
                            pollution: 0,
                            happiness: 100,
                            constructionTimer: 0
                        };
                        engine.revision++;
                    }
                }
            }

            // -------------------------------------------------------
            // CAS 2 : Bâtiment en construction
            // -------------------------------------------------------
            else if (building.state === 'CONSTRUCTION') {
                building.constructionTimer++;
                if (building.constructionTimer > 20 + (idx % 10)) {
                    building.state = 'ACTIVE';
                    engine.revision++;
                }
            }

            // -------------------------------------------------------
            // CAS 3 : Évolution (Level Up)
            // -------------------------------------------------------
            else if (building.state === 'ACTIVE' && building.level < 3) {
                if (Math.random() < 0.001) {
                    const nextLevel = building.level + 1;

                    // Attention ici : building.type est un BuildingType. 
                    // Si BUILDING_COSTS attend un ZoneType, ça peut coincer.
                    // Mais généralement on utilise le building.type pour les upgrades.
                    // Si ça plante ici plus tard, il faudra vérifier tes clés dans BUILDING_COSTS.
                    const costs = BUILDING_COSTS[building.type as unknown as ZoneType] || BUILDING_COSTS[zoneType];
                    const cost = costs ? costs[nextLevel] : null;

                    if (cost && this.tryConsumeResources(engine, cost)) {
                        building.level = nextLevel;
                        building.state = 'CONSTRUCTION';
                        building.constructionTimer = 0;
                        engine.revision++;
                    }
                }
            }
        }
    }
}