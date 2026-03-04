import { MapEngine } from '../MapEngine';
import { BuildingType, BuildingStatus, PlayerResources, BUILDING_SPECS } from '../types';
import { GRID_SIZE } from '../config';

// Consommation de charbon par tick pour 1 niveau de centrale (en unités)
const COAL_PLANT_COAL_PER_TICK = 2;

/**
 * Système de gestion de la production de ressources (Mines, Puits, Énergie...)
 */
export class ResourceSystem {

    /**
     * Mise à jour de la production
     * À appeler périodiquement (ex: tous les 60 ticks / 1 seconde)
     */
    static update(engine: MapEngine): void {
        let totalElectricity = 0;

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

                // ✅ VERIFICATION STOCK SOL >= extractionAmount
                if (mapResourceAmount >= extractionAmount) {

                    // 1. Soustraire du sol
                    engine.resourceMaps[resourceKey][index] -= extractionAmount;

                    // 2. Ajouter à l'inventaire
                    if (engine.resources[inventoryKey] !== undefined) {
                        engine.resources[inventoryKey] += extractionAmount;
                    }

                    // On considère que ça marche
                    building.statusFlags &= ~BuildingStatus.NO_GOODS;

                } else {
                    // ÉPUISÉ !
                    building.statusFlags |= BuildingStatus.NO_GOODS;
                }
            }
        }

        // ✅ SIMULATION ÉNERGÉTIQUE (Centrales Charbon, Solaire, Éolienne)
        for (let i = 0; i < engine.buildingLayer.length; i++) {
            const building = engine.buildingLayer[i];
            if (!building || building.state !== 'ACTIVE') continue;

            const specs = BUILDING_SPECS[building.type];
            if (!specs?.production || specs.production.type !== 'ENERGY') continue;

            const baseOutput = specs.production.amount * building.level;
            let electricityOutput = baseOutput;

            // ── CENTRALE CHARBON : consomme du charbon ──
            if (building.type === BuildingType.POWER_PLANT) {
                const coalNeeded = COAL_PLANT_COAL_PER_TICK * building.level;
                if (engine.resources.coal >= coalNeeded) {
                    engine.resources.coal -= coalNeeded;
                    building.statusFlags &= ~BuildingStatus.NO_GOODS;
                } else {
                    // Pas de charbon = pas d'électricité
                    electricityOutput = 0;
                    building.statusFlags |= BuildingStatus.NO_GOODS;
                }
            }

            // ── CENTRALE SOLAIRE : malus si case forêt adjacente ──
            if (building.type === BuildingType.SOLAR_PANEL) {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const neighbors = [
                    (y > 0) ? (y - 1) * GRID_SIZE + x : -1,
                    (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1,
                    (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1,
                    (x > 0) ? y * GRID_SIZE + (x - 1) : -1,
                ];
                const hasForestShadow = neighbors.some(nIdx => {
                    if (nIdx === -1) return false;
                    // wood resourceMap > 0.3 = tuile forêt
                    return (engine.resourceMaps.wood?.[nIdx] ?? 0) > 0.3;
                });
                if (hasForestShadow) electricityOutput = Math.floor(electricityOutput / 2);
            }

            // ── ÉOLIENNE : bonus altitude ──
            if (building.type === BuildingType.WIND_TURBINE) {
                const altitudeRaw = engine.getLayer(0)?.[i] ?? 0.5; // valeur 0..1
                const altitudeNorm = altitudeRaw * 100; // pass à 0..100
                const windBonus = 1 + (altitudeNorm - 50) / 100; // +0% à 50m, +50% à 100m, -50% à 0m
                electricityOutput = Math.max(0, Math.floor(electricityOutput * windBonus));
            }

            totalElectricity += electricityOutput;
        }

        // Mise à jour du stock d'électricité (valeur "buffer" global)
        engine.resources.electricity = totalElectricity;
    }
}
