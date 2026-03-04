import { MapEngine } from '../MapEngine';
import { BuildingType, BuildingStatus, PlayerResources, BUILDING_SPECS } from '../types';

/**
 * Système de gestion de la production de ressources (Mines, Puits, etc.)
 */
export class ResourceSystem {

    /**
     * Mise à jour de la production
     * À appeler périodiquement (ex: tous les 60 ticks / 1 seconde)
     */
    static update(engine: MapEngine): void {

        // ✅ BÂTIMENTS MINIERS (Mines, Puits de pétrole)
        for (let i = 0; i < engine.buildingLayer.length; i++) {
            const building = engine.buildingLayer[i];
            if (!building) continue;

            // On ne traite que les bâtiments actifs avec une propriété mining
            if (building.state !== 'ACTIVE' || !building.mining) continue;

            // Vérification des travailleurs (Si pas de travailleurs, pas de prod)
            if (building.jobsAssigned <= 0) {
                building.statusFlags |= BuildingStatus.NO_JOBS;
                continue;
            } else {
                building.statusFlags &= ~BuildingStatus.NO_JOBS;
            }

            const miningData = building.mining;
            const index = building.y * engine.config.size + building.x;

            // ✅ MISSION 4 : Ratio de Production Dynamique
            // extractionAmount = BASE * level * (jobsAssigned / maxWorkers)
            const BASE_EXTRACTION = 5;
            const specs = BUILDING_SPECS[building.type];
            const maxWorkers = specs?.maxWorkers || 1;
            const workerRatio = maxWorkers > 0 ? Math.min(1, building.jobsAssigned / maxWorkers) : 0;
            const extractionAmount = BASE_EXTRACTION * building.level * workerRatio;

            if (extractionAmount <= 0) continue; // Pas de travailleurs = pas d'extraction

            // On identifie la ressource sur la carte
            let mapResourceAmount = 0;
            let resourceKey: keyof typeof engine.resourceMaps | null = null;
            let inventoryKey: keyof PlayerResources | null = null;

            if (miningData.resource === 'COAL') { resourceKey = 'coal'; inventoryKey = 'coal'; }
            else if (miningData.resource === 'IRON') { resourceKey = 'iron'; inventoryKey = 'iron'; }
            else if (miningData.resource === 'GOLD') { resourceKey = 'gold'; inventoryKey = 'gold'; }
            else if (miningData.resource === 'SILVER') { resourceKey = 'silver'; inventoryKey = 'silver'; }
            else if (miningData.resource === 'STONE') { resourceKey = 'stone'; inventoryKey = 'stone'; }
            else if (miningData.resource === 'OIL') { resourceKey = 'oil'; inventoryKey = 'oil'; }

            if (resourceKey && inventoryKey) {
                mapResourceAmount = engine.resourceMaps[resourceKey][index];

                // ✅ VERIFICATION STOCK SOL > 5 (ou extractionAmount)
                if (mapResourceAmount >= extractionAmount) {

                    // 1. Soustraire du sol
                    engine.resourceMaps[resourceKey][index] -= extractionAmount;

                    // 2. Ajouter à l'inventaire
                    if (engine.resources[inventoryKey] !== undefined) {
                        engine.resources[inventoryKey] += extractionAmount;
                    }

                    // On considère que ça marche
                    building.statusFlags &= ~BuildingStatus.NO_GOODS; // Plus de "Pas de marchandise" ou "Epuisé"

                } else {
                    // ÉPUISÉ !
                    building.statusFlags |= BuildingStatus.NO_GOODS; // Indique un problème de stock
                }
            }
        }
    }
}
