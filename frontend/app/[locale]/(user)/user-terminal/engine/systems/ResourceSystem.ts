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
                // On pourrait mettre un flag "NO_WORKERS" mais "NO_JOBS" est déjà utilisé pour l'accessibilité
                continue;
            }

            const miningData = building.mining;

            // Quantité extraite (Base)
            let amount = 0;

            // Taux d'extraction par tick (ou par appel de update)
            // Disons que update est appelé toutes les secondes (60 ticks)
            // Valeurs ajustables
            switch (miningData.resource) {
                case 'COAL': amount = 5; break;
                case 'IRON': amount = 3; break;
                case 'GOLD': amount = 1; break;
                case 'STONE': amount = 10; break;
                case 'OIL': amount = 10; break;
            }

            // Bonus d'efficacité (Workers)
            // Si on a 8 workers requis et 4 assignés -> 50% efficacité
            // On ne connait pas le max ici sans specs.
            // On assume que jobsAssigned est "suffisant" pour la base, 
            // ou on multiplie par jobsAssigned (ex: 1 unité par worker)

            // Approche simple : Amount * (jobsAssigned / 4) (Moyenne 4 workers)
            // Ou juste Amount fixe si au moins 1 worker.
            // Allons-y pour Amount fixe pour l'instant pour valider le flux.

            // Ajouter aux ressources du joueur
            if (miningData.resource === 'COAL') engine.resources.coal += amount;
            if (miningData.resource === 'IRON') engine.resources.iron += amount;
            if (miningData.resource === 'GOLD') engine.resources.gold += amount;
            if (miningData.resource === 'STONE') engine.resources.stone += amount;
            if (miningData.resource === 'OIL') engine.resources.oil += amount;

            // Optionnel : Réduire le stock du sol (miningData.amount)
            // miningData.amount -= amount;
            // if (miningData.amount <= 0) {
            //    // Épuisé !
            //    // building.statusFlags |= BuildingStatus.ABANDONED; // ou status "DEPLETED"
            // }
        }
    }
}
