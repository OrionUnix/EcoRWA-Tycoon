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
            // EXCEPTION : Si on construit une Mine ou un Puits de pétrole, on peut écraser la zone (auto-clear)
            // Mais pour l'instant, checkBuildValidity doit retourner true/false.
            // On va dire que c'est valide SI c'est une mine, car on gérera le nettoyage dans placeBuilding.
            const isResourceExtractor = (type === BuildingType.MINE || type === BuildingType.OIL_RIG);

            if (!isResourceExtractor) {
                console.log('❌ Validation: Zone existante:', engine.zoningLayer[index]);
                return { valid: false, reason: "Une zone est déjà placée ici (utilisez Bulldozer d'abord)" };
            }
        }

        // 5. AUCUN bâtiment sur l'eau (règle stricte)
        const waterLevel = engine.getLayer(1)[index];
        const isWater = waterLevel > 0.3;

        if (type === BuildingType.OIL_RIG) {

        } else {
            if (isWater) {
                console.log('❌ Validation: Sur l\'eau');
                return { valid: false, reason: "Impossible de construire sur l'eau" };
            }
        }

        // Check Ressource Spécifique
        if (type === BuildingType.MINE) {
            const hasCoal = engine.resourceMaps.coal && engine.resourceMaps.coal[index] > 0;
            const hasIron = engine.resourceMaps.iron && engine.resourceMaps.iron[index] > 0;
            const hasStone = engine.resourceMaps.stone && engine.resourceMaps.stone[index] > 0;
            const hasGold = engine.resourceMaps.gold && engine.resourceMaps.gold[index] > 0;

            if (!hasCoal && !hasIron && !hasStone && !hasGold) {
                return { valid: false, reason: "Doit être placé sur un gisement (Charbon, Fer, Or, Pierre)" };
            }
        }
        else if (type === BuildingType.OIL_RIG) {
            const hasOil = engine.resourceMaps.oil && engine.resourceMaps.oil[index] > 0;
            if (!hasOil) {
                return { valid: false, reason: "Doit être placé sur un gisement de Pétrole" };
            }
        }
        else if (type === BuildingType.HUNTER_HUT) {
            const hasAnimals = engine.resourceMaps.animals && engine.resourceMaps.animals[index] > 0;
            const isForest = engine.biomes[index] === 4; // 4 = FOREST
            console.log(`Checking HUNTER_HUT at ${index}: hasAnimals=${hasAnimals}, isForest=${isForest}`);

            if (!hasAnimals && !isForest) {
                return { valid: false, reason: "Doit être placé sur du Gibier ou une Forêt" };
            }
        }
        else if (type === BuildingType.FISHERMAN) {
            const neighbors = [
                (Math.floor(index / GRID_SIZE) > 0) ? index - GRID_SIZE : -1,
                (Math.floor(index / GRID_SIZE) < GRID_SIZE - 1) ? index + GRID_SIZE : -1,
                (index % GRID_SIZE < GRID_SIZE - 1) ? index + 1 : -1,
                (index % GRID_SIZE > 0) ? index - 1 : -1
            ];

            const hasWaterNeighbor = neighbors.some(n => n !== -1 && engine.getLayer(1)[n] > 0.3);
            if (!hasWaterNeighbor) {
                return { valid: false, reason: "Doit être adjacent à l'EAU" };
            }
        }
        else if (type === BuildingType.LUMBER_HUT) {
            // Check self and neighbors for Forest or Wood
            const checkIndices = [index];
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);

            // Add 8 neighbors
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                        checkIndices.push(ny * GRID_SIZE + nx);
                    }
                }
            }

            const hasForestOrWood = checkIndices.some(idx => {
                const isForest = engine.biomes[idx] === 4; // FOREST
                const hasWood = engine.resourceMaps.wood && engine.resourceMaps.wood[idx] > 0;
                return isForest || hasWood;
            });

            if (!hasForestOrWood) {
                return { valid: false, reason: "Doit être près d'une FORÊT" };
            }
        }

        // 6. Coût financier
        if (engine.resources.money < specs.cost) {
            console.log(`❌ Validation: Argent insuffisant (${engine.resources.money}$ < ${specs.cost}$)`);
            return { valid: false, reason: `Fonds insuffisants (coût: ${specs.cost}$)` };
        }

        // 7. TOUS LES BÂTIMENTS DOIVENT ÊTRE ADJACENTS À UNE ROUTE (règle stricte)
        // Exception : OIL_RIG en mer n'a pas besoin de route ? (Ou pont ?)
        // Pour simplifier, exigeons route pour tout le monde pour l'instant (Workers need access)
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

        // 2b. Nettoyage Zone (Auto-clear pour les mines)
        if (engine.zoningLayer[index]) {
            PopulationManager.onZoneRemoved(engine.zoningLayer[index]!); // "!" car on a vérifié
            engine.zoningLayer[index] = null;
        }

        // Préparation des données minières
        let miningData: { resource: any; amount: number } | undefined;
        if (type === BuildingType.MINE) {
            if (engine.resourceMaps.coal && engine.resourceMaps.coal[index] > 0) miningData = { resource: 'COAL', amount: 1000 };
            else if (engine.resourceMaps.iron && engine.resourceMaps.iron[index] > 0) miningData = { resource: 'IRON', amount: 800 };
            else if (engine.resourceMaps.stone && engine.resourceMaps.stone[index] > 0) miningData = { resource: 'STONE', amount: 2000 };
            else if (engine.resourceMaps.gold && engine.resourceMaps.gold[index] > 0) miningData = { resource: 'GOLD', amount: 500 };
        }
        else if (type === BuildingType.OIL_RIG) {
            if (engine.resourceMaps.oil && engine.resourceMaps.oil[index] > 0) miningData = { resource: 'OIL', amount: 5000 };
        }

        // 3. Création Données
        const building: BuildingData = {
            type: type,
            x: index % GRID_SIZE,
            y: Math.floor(index / GRID_SIZE),
            variant: Math.floor(Math.random() * 3),
            level: 1,
            state: 'CONSTRUCTION',
            constructionTimer: 0,
            pollution: 0,
            happiness: 100,
            statusFlags: 0,
            stability: 0,
            jobsAssigned: 0,
            mining: miningData
        };

        engine.buildingLayer[index] = building;
        engine.revision++;

        // 4. Notification PopulationManager (Jobs & Production)
        PopulationManager.onBuildingPlaced(specs);

        return { success: true, message: "Construction terminée." };
    }
}