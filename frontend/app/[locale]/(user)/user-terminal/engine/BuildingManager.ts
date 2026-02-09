import { MapEngine } from './MapEngine';
import { BuildingType, BuildingData, BUILDING_SPECS } from './types';
import { GRID_SIZE } from './config';
import { ResourceRenderer } from './ResourceRenderer';

export class BuildingManager {

    /**
     * Vérifie si la construction est possible sur cette case
     */
    static checkBuildValidity(engine: MapEngine, index: number, type: BuildingType): { valid: boolean, reason?: string } {
        // 1. Validité de l'index
        if (index < 0 || index >= engine.config.totalCells) {
            return { valid: false, reason: "Hors carte" };
        }

        // 2. Case déjà occupée ?
        if (engine.buildingLayer[index]) {
            return { valid: false, reason: "Occupé par un bâtiment" };
        }
        if (engine.roadLayer[index]) {
            return { valid: false, reason: "Impossible de construire sur la route" };
        }

        // 3. Eau (Vérifie bien que l'index 1 correspond à ton layer d'eau/élévation)
        const isWater = engine.getLayer(1)[index] > 0.3;
        if (isWater) {
            return { valid: false, reason: "Impossible de construire sur l'eau" };
        }

        // 4. Coût financier
        const specs = BUILDING_SPECS[type];
        if (engine.resources.money < specs.cost) {
            return { valid: false, reason: "Fonds insuffisants" };
        }

        // 5. Adjacence Route
        if (!this.isNextToRoad(engine, index)) {
            return { valid: false, reason: "Doit être adjacent à une route" };
        }

        return { valid: true };
    }

    /**
     * Vérifie si une des 4 cases voisines contient une route
     */
    static isNextToRoad(engine: MapEngine, index: number): boolean {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors = [
            (y > 0) ? (y - 1) * GRID_SIZE + x : -1,             // N
            (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1, // S
            (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1, // E
            (x > 0) ? y * GRID_SIZE + (x - 1) : -1              // W
        ];

        return neighbors.some(nIdx => nIdx !== -1 && engine.roadLayer[nIdx] !== null);
    }

    /**
     * Place le bâtiment MANUELLEMENT (quand le joueur clique)
     */
    static placeBuilding(engine: MapEngine, index: number, type: BuildingType): { success: boolean, message?: string } {
        const check = this.checkBuildValidity(engine, index, type);
        if (!check.valid) {
            return { success: false, message: check.reason };
        }

        const specs = BUILDING_SPECS[type];

        // 1. Paiement
        engine.resources.money -= specs.cost;

        // 2. Nettoyage Nature
        if (engine.resourceMaps.wood) engine.resourceMaps.wood[index] = 0;
        ResourceRenderer.removeResourceAt(index);

        // 3. Création Données
        const building: BuildingData = {
            type: type, // Ici on utilise direct le type passé par le bouton
            x: index % GRID_SIZE,
            y: Math.floor(index / GRID_SIZE),
            variant: Math.floor(Math.random() * 3),
            level: 1,
            state: 'CONSTRUCTION',
            constructionTimer: 0,
            pollution: 0,
            happiness: 100
        };

        engine.buildingLayer[index] = building;
        engine.revision++;

        return { success: true, message: "Construction terminée." };
    }
}