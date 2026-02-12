import { MapEngine } from './MapEngine';
import { BuildingType, BuildingData, BUILDING_SPECS, ZoneType } from './types';
import { GRID_SIZE } from './config';
import { ResourceRenderer } from './ResourceRenderer';
import { PopulationManager } from './systems/PopulationManager';

export class BuildingManager {

    /**
     * Vérifie si la construction est possible sur cette case
     */
    static checkBuildValidity(engine: MapEngine, index: number, type: BuildingType): { valid: boolean, reason?: string } {
        console.log(`🔍 BuildingManager: Vérification placement ${type} à index ${index}`);
        const specs = BUILDING_SPECS[type];

        // 1. Validité de l'index
        if (index < 0 || index >= engine.config.totalCells) {
            console.log('❌ Validation: Hors carte');
            return { valid: false, reason: "Hors carte" };
        }

        // 2. Case déjà occupée par un bâtiment ?
        if (engine.buildingLayer[index]) {
            console.log('❌ Validation: Bâtiment existant');
            return { valid: false, reason: "Occupé par un bâtiment" };
        }

        // 3. Case déjà occupée par une route ?
        if (engine.roadLayer[index]) {
            console.log('❌ Validation: Route existante');
            return { valid: false, reason: "Impossible de construire sur la route" };
        }

        // 4. Case déjà occupée par une zone (Residential, Commercial, Industrial) ?
        if (engine.zoningLayer[index]) {
            console.log('❌ Validation: Zone existante:', engine.zoningLayer[index]);
            return { valid: false, reason: "Une zone est déjà placée ici (utilisez Bulldozer d'abord)" };
        }

        // 5. AUCUN bâtiment sur l'eau (règle stricte)
        const waterLevel = engine.getLayer(1)[index];
        const isWater = waterLevel > 0.3;
        console.log(`🌊 Validation: waterLevel=${waterLevel.toFixed(2)}, isWater=${isWater}`);
        if (isWater) {
            console.log('❌ Validation: Sur l\'eau');
            return { valid: false, reason: "Impossible de construire sur l'eau" };
        }

        // 6. Coût financier
        if (engine.resources.money < specs.cost) {
            console.log(`❌ Validation: Argent insuffisant (${engine.resources.money}$ < ${specs.cost}$)`);
            return { valid: false, reason: `Fonds insuffisants (coût: ${specs.cost}$)` };
        }

        // 7. TOUS LES BÂTIMENTS DOIVENT ÊTRE ADJACENTS À UNE ROUTE (règle stricte)
        const hasRoad = this.isNextToRoad(engine, index);
        console.log(`🛣️ Validation: hasAdjacentRoad=${hasRoad}`);
        if (!hasRoad) {
            console.log('❌ Validation: Pas de route adjacente');
            return { valid: false, reason: "Doit être adjacent à une route" };
        }

        console.log('✅ Validation: SUCCÈS - placement autorisé');
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
            happiness: 100,
            statusFlags: 0, // Pas de problème initial
            stability: 0    // Neutre au départ
        };

        engine.buildingLayer[index] = building;
        engine.revision++;

        // 4. Notification PopulationManager (Jobs & Production)
        PopulationManager.onBuildingPlaced(specs);

        return { success: true, message: "Construction terminée." };
    }
}