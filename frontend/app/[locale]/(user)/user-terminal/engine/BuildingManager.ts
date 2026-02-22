import { MapEngine } from './MapEngine';
import { BuildingType, BuildingData, BUILDING_SPECS, ZoneType } from './types';
import { GRID_SIZE } from './config';
import { ResourceRenderer } from './ResourceRenderer';
import { WildlifeRenderer } from './WildlifeRenderer';
import { PopulationManager } from './systems/PopulationManager';
import { BuildingRenderer } from './BuildingRenderer';

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
            const isResourceExtractor = (
                type === BuildingType.MINE ||
                type === BuildingType.OIL_RIG ||
                type === BuildingType.OIL_PUMP
            );

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
            const hasSilver = engine.resourceMaps.silver && engine.resourceMaps.silver[index] > 0;
            const hasGold = engine.resourceMaps.gold && engine.resourceMaps.gold[index] > 0;
            const hasStone = engine.resourceMaps.stone && engine.resourceMaps.stone[index] > 0;

            if (!hasCoal && !hasIron && !hasSilver && !hasGold && !hasStone) {
                return { valid: false, reason: "Doit être placé sur un gisement de Minerai (Fer, Or, Argent, Pierre, Charbon)" };
            }
        }
        else if (type === BuildingType.OIL_RIG || type === BuildingType.OIL_PUMP) {
            const hasOil = engine.resourceMaps.oil && engine.resourceMaps.oil[index] > 0;
            if (!hasOil) {
                return { valid: false, reason: "Doit être placé sur un gisement de Pétrole" };
            }
        }
        else if (type === BuildingType.HUNTER_HUT || type === BuildingType.FISHERMAN || type === BuildingType.LUMBER_HUT) {
            // ✅ NOUVELLE LOGIQUE: Check Yield dans le radius au lieu de la case exacte
            const yieldData = this.calculatePotentialYield(engine, index, type);
            if (yieldData.amount <= 0) {
                if (type === BuildingType.HUNTER_HUT) return { valid: false, reason: "Aucune forêt ou gibier à proximité" };
                if (type === BuildingType.FISHERMAN) return { valid: false, reason: "Aucune eau à proximité" };
                if (type === BuildingType.LUMBER_HUT) return { valid: false, reason: "Aucune forêt à proximité" };
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
     * Calcule le rendement potentiel autour d'un point
     */
    static calculatePotentialYield(engine: MapEngine, index: number, type: BuildingType): { amount: number, label: string } {
        const cx = index % GRID_SIZE;
        const cy = Math.floor(index / GRID_SIZE);
        const radius = 5; // Rayon de 5 cases
        let count = 0;
        let label = "Ressources";

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = cx + dx;
                const ny = cy + dy;

                if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
                // Cercle approximatif
                if (dx * dx + dy * dy > radius * radius) continue;

                const idx = ny * GRID_SIZE + nx;

                if (type === BuildingType.HUNTER_HUT) {
                    label = "Gibier/Forêt";
                    // Compte Forêt (4) ou Animals map
                    if (engine.biomes[idx] === 4) count += 1;
                    if (engine.resourceMaps.animals && engine.resourceMaps.animals[idx] > 0) count += 5; // Bonus pour animaux
                }
                else if (type === BuildingType.LUMBER_HUT) {
                    label = "Bois";
                    if (engine.biomes[idx] === 4) count += 10; // Arbre = 10 bois
                    if (engine.resourceMaps.wood && engine.resourceMaps.wood[idx] > 0) count += 5;
                }
                else if (type === BuildingType.FISHERMAN) {
                    label = "Zone de Pêche";
                    // Compte Eau
                    if (engine.getLayer(1)[idx] > 0.3) count += 1; // 1 = WATER
                }
            }
        }

        // ✅ NOUVEAU : ESTIMATION POUR LES MINES (Rayon 0, juste sous le bâtiment)
        // Mais comme la fonction est appelée "autour d'un point", on peut tricher
        // ou juste check l'index central.
        if (type === BuildingType.MINE) {
            label = "Ressource (Est.)";
            if (engine.resourceMaps.coal[index] > 0) count = 5; // Production de base
            else if (engine.resourceMaps.gold[index] > 0) count = 5;
            else if (engine.resourceMaps.silver[index] > 0) count = 5;
            else if (engine.resourceMaps.iron[index] > 0) count = 5;
            else if (engine.resourceMaps.stone[index] > 0) count = 5;
        }
        else if (type === BuildingType.OIL_PUMP || type === BuildingType.OIL_RIG) {
            label = "Pétrole (Est.)";
            if (engine.resourceMaps.oil[index] > 0) count = 5;
        }

        return { amount: count, label };
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
        WildlifeRenderer.removeWildlifeAt(index, engine);

        // 2b. Nettoyage Zone (Auto-clear pour les mines)
        if (engine.zoningLayer[index]) {
            PopulationManager.onZoneRemoved(engine.zoningLayer[index]!); // "!" car on a vérifié
            engine.zoningLayer[index] = null;
        }

        // Préparation des données minières
        let miningData: { resource: any; amount: number } | undefined;

        if (type === BuildingType.MINE) {
            if (engine.resourceMaps.coal && engine.resourceMaps.coal[index] > 0) miningData = { resource: 'COAL', amount: engine.resourceMaps.coal[index] };
            else if (engine.resourceMaps.gold && engine.resourceMaps.gold[index] > 0) miningData = { resource: 'GOLD', amount: engine.resourceMaps.gold[index] };
            else if (engine.resourceMaps.silver && engine.resourceMaps.silver[index] > 0) miningData = { resource: 'SILVER', amount: engine.resourceMaps.silver[index] };
            else if (engine.resourceMaps.iron && engine.resourceMaps.iron[index] > 0) miningData = { resource: 'IRON', amount: engine.resourceMaps.iron[index] };
            else if (engine.resourceMaps.stone && engine.resourceMaps.stone[index] > 0) miningData = { resource: 'STONE', amount: engine.resourceMaps.stone[index] };
        }
        else if (type === BuildingType.OIL_RIG || type === BuildingType.OIL_PUMP) {
            if (engine.resourceMaps.oil && engine.resourceMaps.oil[index] > 0) miningData = { resource: 'OIL', amount: engine.resourceMaps.oil[index] };
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

        // ✅ INITIALISATION DES CONTRATS (Marché)
        if (type === BuildingType.FOOD_MARKET) {
            building.activeContracts = [
                { resource: 'FOOD', amountPerTick: 10, pricePerUnit: 5, active: true } // Vente de 10 bouffe / tick
            ];
        }

        engine.buildingLayer[index] = building;
        engine.revision++;

        // 4. Notification PopulationManager (Jobs & Production)
        PopulationManager.onBuildingPlaced(specs);

        return { success: true, message: "Construction terminée." };
    }

    /**
     * Améliore un bâtiment (Level Up)
     */
    static upgradeBuilding(engine: MapEngine, index: number): { success: boolean, message?: string } {
        const building = engine.buildingLayer[index];
        if (!building) return { success: false, message: "Aucun bâtiment ici." };

        const specs = BUILDING_SPECS[building.type];
        if (!specs.upgradeCost || !specs.maxLevel) {
            return { success: false, message: "Ce bâtiment ne peut pas être amélioré." };
        }

        if (building.level >= specs.maxLevel) {
            return { success: false, message: "Niveau maximum atteint." };
        }

        // Calcul du coût (Basé sur le niveau actuel ? Ou fixe ?)
        // Le user a dit "budget >= upgradeCost * level"
        // Donc pour passer au niveau 2 (étant lvl 1), on paie cost * 1.
        // Pour passer au niveau 3 (étant lvl 2), on paie cost * 2.
        const cost = specs.upgradeCost * building.level;

        if (engine.resources.money < cost) {
            return { success: false, message: `Fonds insuffisants (${cost}$ requis)` };
        }

        // Paiement
        engine.resources.money -= cost;

        // Level Up
        const oldLevel = building.level;
        building.level++;

        // Effet visuel immédiat (Redraw)
        engine.revision++;

        // Vider le cache visuel pour forcer la nouvelle texture HD
        BuildingRenderer.removeBuilding(index);

        // Jouer le nuage de poussière
        BuildingRenderer.playDemolitionFX(index, engine);

        // Mise à jour des stats globales (Production / Jobs)
        PopulationManager.onBuildingUpgraded(specs, oldLevel, building.level);

        console.log(`🆙 Upgrade: ${specs.name} L${oldLevel} -> L${building.level} (Cost: ${cost}$)`);

        return { success: true, message: `Amélioration réussie ! (Niveau ${building.level})` };
    }
}