import { MapEngine } from '../MapEngine';
import { BUILDING_SPECS } from '../types';
import { PopulationManager } from './PopulationManager';

// ═══════════════════════════════════════════════════════
// BuildingUpgradeSystem — Système ECS
// Gère l'évolution des bâtiments (Level Up)
// ═══════════════════════════════════════════════════════

export class BuildingUpgradeSystem {

    /**
     * Améliore le niveau d'un bâtiment (mutation ECS pure)
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

        const cost = specs.upgradeCost * building.level;
        if (engine.resources.money < cost) {
            return { success: false, message: `Fonds insuffisants (${cost}$ requis)` };
        }

        // 1. Vérification des matériaux requis
        let missingRes = '';
        if (specs.resourceCost) {
            for (const [res, amount] of Object.entries(specs.resourceCost)) {
                const req = (amount as number) * building.level;
                if (((engine.resources as any)[res] || 0) < req) {
                    missingRes = res;
                    break;
                }
            }
        }
        if (missingRes) {
            return { success: false, message: `Matériaux insuffisants (${missingRes})` };
        }

        // 2. Déduction des ressources
        engine.resources.money -= cost;
        if (specs.resourceCost) {
            for (const [res, amount] of Object.entries(specs.resourceCost)) {
                (engine.resources as any)[res] -= (amount as number) * building.level;
            }
        }

        // 3. Mutation du Composant
        const oldLevel = building.level;
        building.level++;

        engine.revision++;

        // 5. Mise à jour de la population/jobs
        PopulationManager.onBuildingUpgraded(specs, oldLevel, building.level);

        // ✅ Signal mutation pour l'Auto-Save
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('city_mutated'));
        }

        console.log(`🆙 UpgradeSystem: ${specs.name} L${oldLevel} -> L${building.level} (Cost: ${cost}$)`);
        return { success: true, message: `Amélioration réussie ! (Niveau ${building.level})` };
    }
}
