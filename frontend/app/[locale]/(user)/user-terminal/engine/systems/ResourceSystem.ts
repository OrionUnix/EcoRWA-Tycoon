import { MapEngine } from '../MapEngine';
import { BuildingType, BuildingStatus, PlayerResources } from '../types';

/**
 * Système de gestion de la production de ressources (Mines, Puits, etc.)
 */
export class ResourceSystem {

    /**
     * Mise à jour de la production
     * À appeler périodiquement (ex: tous les 60 ticks / 1 seconde)
     */
    static update(engine: MapEngine): void {

        for (let i = 0; i < engine.buildingLayer.length; i++) {
            const building = engine.buildingLayer[i];
            if (!building) continue;

            // On ne traite que les bâtiments actifs avec une propriété mining
            if (building.state !== 'ACTIVE' || !building.mining) continue;

            // Vérification des travailleurs
            // Si pas assez de travailleurs, production réduite ou nulle ?
            // Simplification : Il faut au moins 1 travailleur pour produire
            // Ou mieux : Production proportionnelle aux travailleurs

            // Récupéraion spec pour savoir combien de workers max
            // On peut aussi stocker maxWorkers dans mining ? ou lire specs
            // Pour l'instant, on fait simple : si jobsAssigned > 0, ça produit.

            if (building.jobsAssigned <= 0) {
                // Pas de travailleurs -> Pas de prod
                continue;
            }

            const miningData = building.mining;
            const index = building.y * engine.config.size + building.x;

            // Quantité extraite (Base)
            let amount = 0;

            switch (miningData.resource) {
                case 'COAL': amount = 5; break;
                case 'IRON': amount = 3; break;
                case 'GOLD': amount = 1; break;
                case 'SILVER': amount = 2; break; // Added SILVER
                case 'STONE': amount = 10; break;
                case 'OIL': amount = 10; break;
            }

            // ✅ MULTIPLICATEUR DE NIVEAU (Upgrade)
            amount *= (building.level || 1);

            // ✅ EXTRACTION DU SOL (Logique demandée par user)
            // On vérifie s'il reste de la ressource dans le sol
            let mapResourceAmount = 0;
            if (miningData.resource === 'COAL') mapResourceAmount = engine.resourceMaps.coal[index];
            else if (miningData.resource === 'IRON') mapResourceAmount = engine.resourceMaps.iron[index];
            else if (miningData.resource === 'GOLD') mapResourceAmount = engine.resourceMaps.gold[index];
            else if (miningData.resource === 'SILVER') mapResourceAmount = engine.resourceMaps.silver[index];
            else if (miningData.resource === 'STONE') mapResourceAmount = engine.resourceMaps.stone[index];
            else if (miningData.resource === 'OIL') mapResourceAmount = engine.resourceMaps.oil[index];

            // Si plus de ressources, on arrête
            if (mapResourceAmount <= 0) {
                // TODO: Marquer le bâtiment comme "Épuisé" (Icône rouge ?)
                continue;
            }

            // On ne peut pas extraire plus que ce qu'il y a
            // Note: Les valeurs de mapResourceAmount sont des "intesités" (0.0 - 1.0 ou plus selon génération)
            // Pour l'instant on décrémente directement une petite valeur pour simuler l'épuisement lent
            // Si on retire 'amount' direct, ça va vider très vite si mapResourceAmount est petit.
            // Le user a dit : "tile.resourceAmount -= 5". 
            // Si mapResourceAmount est ~1000 (comme vu dans MapEngine), c'est ok. 
            // Si c'est 0.8, c'est mort.
            // On assume que MapGenerator a généré des valeurs CONSÉQUENTES ou que l'unité est différente.
            // Update: MapGenerator génère des intensités > 0.1.
            // Pour que ça dure, on va diviser l'impact sur le sol.
            // MAIS le user veut voir le sol baisser de 5.

            // Correction : MapEngine.calculateSummary multiplie par 5000 pour l'affichage.
            // La valeur brute dans resourceMaps est petite.
            // On va donc retirer une fraction très faible (ex: 0.001) qui correspond à 5 tonnes.
            const DEPLETION_RATE = 0.001 * amount;

            // Mise à jour du sol
            if (miningData.resource === 'COAL') engine.resourceMaps.coal[index] -= DEPLETION_RATE;
            else if (miningData.resource === 'IRON') engine.resourceMaps.iron[index] -= DEPLETION_RATE;
            else if (miningData.resource === 'GOLD') engine.resourceMaps.gold[index] -= DEPLETION_RATE;
            else if (miningData.resource === 'SILVER') engine.resourceMaps.silver[index] -= DEPLETION_RATE;
            else if (miningData.resource === 'STONE') engine.resourceMaps.stone[index] -= DEPLETION_RATE;
            else if (miningData.resource === 'OIL') engine.resourceMaps.oil[index] -= DEPLETION_RATE;

            // Ajouter aux ressources du joueur
            if (miningData.resource === 'COAL') engine.resources.coal += amount;
            if (miningData.resource === 'IRON') engine.resources.iron += amount;
            if (miningData.resource === 'GOLD') engine.resources.gold += amount;
            if (miningData.resource === 'SILVER') engine.resources.silver += amount;
            if (miningData.resource === 'STONE') engine.resources.stone += amount;
            if (miningData.resource === 'OIL') engine.resources.oil += amount;
        }
    }
}
