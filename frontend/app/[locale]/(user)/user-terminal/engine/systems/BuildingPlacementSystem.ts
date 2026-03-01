import { MapEngine } from '../MapEngine';
import { BuildingType, BuildingData, BUILDING_SPECS } from '../types';
import { BuildingMath } from '../utils/BuildingMath';
import { GRID_SIZE } from '../config';
import { PopulationManager } from './PopulationManager';
// import { ResourceRenderer } from '../ResourceRenderer'; // À termes : Système ECS Découplé
// import { WildlifeRenderer } from '../WildlifeRenderer'; // À termes : Système ECS Découplé

// ═══════════════════════════════════════════════════════
// BuildingPlacementSystem — Logique ECS de mutation des entités
// Pur: modifie les données et flag 'dirtyTiles' pour le Rendu
// ═══════════════════════════════════════════════════════

export class BuildingPlacementSystem {

    /**
     * Place un bâtiment dans la couche de données ECS
     */
    static placeBuilding(engine: MapEngine, index: number, type: BuildingType): { success: boolean, message?: string } {
        // 1. Validation mathématique stricte
        const check = BuildingMath.checkBuildValidity(engine, index, type);
        if (!check.valid) {
            return { success: false, message: check.reason };
        }

        const specs = BUILDING_SPECS[type];

        // 2. Déduction financière
        engine.resources.money -= specs.cost;

        // 3. Altération de la flore/faune dans ECS (Destruction de la Nature)
        if (engine.resourceMaps.wood) engine.resourceMaps.wood[index] = 0;

        // 4. Nettoyage de Zone si chevauchement (Mines écrasent les Zones)
        if (engine.zoningLayer[index]) {
            PopulationManager.onZoneRemoved(engine.zoningLayer[index]!);
            engine.zoningLayer[index] = null;
        }

        // 5. Configuration ECS du bâtiment
        let miningData: { resource: any; amount: number } | undefined;
        if (type === BuildingType.MINE) {
            if (engine.resourceMaps.coal[index] > 0) miningData = { resource: 'COAL', amount: engine.resourceMaps.coal[index] };
            else if (engine.resourceMaps.gold[index] > 0) miningData = { resource: 'GOLD', amount: engine.resourceMaps.gold[index] };
            else if (engine.resourceMaps.silver[index] > 0) miningData = { resource: 'SILVER', amount: engine.resourceMaps.silver[index] };
            else if (engine.resourceMaps.iron[index] > 0) miningData = { resource: 'IRON', amount: engine.resourceMaps.iron[index] };
            else if (engine.resourceMaps.stone[index] > 0) miningData = { resource: 'STONE', amount: engine.resourceMaps.stone[index] };
        }
        else if (type === BuildingType.OIL_RIG || type === BuildingType.OIL_PUMP) {
            if (engine.resourceMaps.oil[index] > 0) miningData = { resource: 'OIL', amount: engine.resourceMaps.oil[index] };
        }

        // 6. Spawn du Component Bâtiment
        const building: BuildingData = {
            type: type,
            x: index % GRID_SIZE,
            y: Math.floor(index / GRID_SIZE),
            variant: Math.floor(Math.random() * 2), // Tirage de la variante (0=A, 1=B)
            level: 1,
            state: 'CONSTRUCTION',
            constructionTimer: 0,
            pollution: 0,
            happiness: 100,
            statusFlags: 0,
            stability: 0,
            jobsAssigned: 0,
            mining: miningData,
            activeContracts: type === BuildingType.FOOD_MARKET
                ? [{ resource: 'FOOD', amountPerTick: 10, pricePerUnit: 5, active: true }]
                : undefined
        };

        // 7. Injecter dans le Monde
        engine.buildingLayer[index] = building;
        engine.revision++; // Flag tick update global

        // Notification des managers passifs
        PopulationManager.onBuildingPlaced(specs);

        // ✅ Auto-Save : signal "le monde a changé"
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('city_mutated'));
        }

        return { success: true, message: "Construction terminée." };
    }
}
