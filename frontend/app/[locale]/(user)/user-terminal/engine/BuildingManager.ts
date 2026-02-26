import { BuildingMath } from './utils/BuildingMath';
import { BuildingPlacementSystem } from './systems/BuildingPlacementSystem';
import { BuildingUpgradeSystem } from './systems/BuildingUpgradeSystem';

// ═══════════════════════════════════════════════════════
// FAÇADE DE TRANSITION: Évite de casser les 5 fichiers (UI/Systems)
// qui importaient directement le BuildingManager monolithique.
// ═══════════════════════════════════════════════════════

export class BuildingManager {
    // Math & Logique de validation pure
    static checkBuildValidity = BuildingMath.checkBuildValidity;
    static calculatePotentialYield = BuildingMath.calculatePotentialYield;
    static isNextToRoad = BuildingMath.isNextToRoad;

    // Mutations ECS pures
    static placeBuilding = BuildingPlacementSystem.placeBuilding;
    static upgradeBuilding = BuildingUpgradeSystem.upgradeBuilding;
}