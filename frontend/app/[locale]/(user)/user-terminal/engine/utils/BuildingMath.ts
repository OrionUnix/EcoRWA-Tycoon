import { MapEngine } from '../MapEngine';
import { BuildingType, BUILDING_SPECS } from '../types';
import { GRID_SIZE } from '../config';
import { advisorStore } from '../../store/AdvisorStore';

// ═══════════════════════════════════════════════════════
// BuildingMath — Pur Calcul (Zéro effet de bord)
// Vérifications mathématiques et logiques de placement
// ═══════════════════════════════════════════════════════

export class BuildingMath {

    /**
     * Calcule le rendement approximatif autour d'un point
     */
    static calculatePotentialYield(engine: MapEngine, index: number, type: BuildingType): { amount: number, label: string } {
        const cx = index % GRID_SIZE;
        const cy = Math.floor(index / GRID_SIZE);
        const radius = 5;
        let count = 0;
        let label = "Ressources";

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = cx + dx;
                const ny = cy + dy;

                if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
                if (dx * dx + dy * dy > radius * radius) continue; // Cercle inscrit

                const idx = ny * GRID_SIZE + nx;

                if (type === BuildingType.HUNTER_HUT) {
                    label = "Gibier/Forêt";
                    if (engine.biomes[idx] === 4) count += 1;
                    if (engine.resourceMaps.animals && engine.resourceMaps.animals[idx] > 0) count += 5;
                }
                else if (type === BuildingType.LUMBER_HUT) {
                    label = "Bois";
                    if (engine.biomes[idx] === 4) count += 10;
                    if (engine.resourceMaps.wood && engine.resourceMaps.wood[idx] > 0) count += 5;
                }
                else if (type === BuildingType.FISHERMAN) {
                    label = "Zone de Pêche";
                    if (engine.getLayer(1)[idx] > 0.3) count += 1;
                }
            }
        }

        // Gisements exacts pour Mines et Puits de pétrole
        if (type === BuildingType.MINE) {
            label = "Ressource (Est.)";
            if (engine.resourceMaps.coal[index] > 0) count = 5;
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
     * Vérifie si l'index est adjacent (N, S, E, O) à une route
     */
    static isNextToRoad(engine: MapEngine, index: number): boolean {
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);

        const neighbors = [
            (y > 0) ? (y - 1) * GRID_SIZE + x : -1,
            (y < GRID_SIZE - 1) ? (y + 1) * GRID_SIZE + x : -1,
            (x < GRID_SIZE - 1) ? y * GRID_SIZE + (x + 1) : -1,
            (x > 0) ? y * GRID_SIZE + (x - 1) : -1
        ];

        return neighbors.some(nIdx => nIdx !== -1 && engine.roadLayer[nIdx] !== null);
    }

    /**
     * Valide de manière stricte si un bâtiment peut être placé (Conditions, Coûts, Sol)
     */
    static checkBuildValidity(engine: MapEngine, index: number, type: BuildingType): { valid: boolean, reason?: string } {
        const specs = BUILDING_SPECS[type];

        if (index < 0 || index >= engine.config.totalCells) return { valid: false, reason: "Hors carte" };
        if (engine.buildingLayer[index]) return { valid: false, reason: "Occupé par un bâtiment" };
        if (engine.roadLayer[index]) return { valid: false, reason: "Impossible de construire sur la route" };

        if (engine.zoningLayer[index]) {
            const isResourceExtractor = (type === BuildingType.MINE || type === BuildingType.OIL_RIG || type === BuildingType.OIL_PUMP);
            if (!isResourceExtractor) {
                return { valid: false, reason: "Une zone est déjà placée ici (utilisez Bulldozer d'abord)" };
            }
        }

        const isWater = engine.getLayer(1)[index] > 0.3;
        if (type !== BuildingType.OIL_RIG && isWater) {
            return { valid: false, reason: "Impossible de construire sur l'eau" };
        }

        if (type === BuildingType.MINE) {
            const hasResource = (engine.resourceMaps.coal[index] > 0 || engine.resourceMaps.iron[index] > 0 || engine.resourceMaps.silver[index] > 0 || engine.resourceMaps.gold[index] > 0 || engine.resourceMaps.stone[index] > 0);
            if (!hasResource) return { valid: false, reason: "Doit être placé sur un gisement de Minerai" };
        }
        else if (type === BuildingType.OIL_RIG || type === BuildingType.OIL_PUMP) {
            const hasOil = engine.resourceMaps.oil && engine.resourceMaps.oil[index] > 0;
            if (!hasOil) return { valid: false, reason: "Doit être placé sur un gisement de Pétrole" };
        }
        else if (type === BuildingType.HUNTER_HUT || type === BuildingType.FISHERMAN || type === BuildingType.LUMBER_HUT) {
            const yieldData = this.calculatePotentialYield(engine, index, type);
            if (yieldData.amount <= 0) {
                if (type === BuildingType.HUNTER_HUT) return { valid: false, reason: "Aucune forêt ou gibier à proximité" };
                if (type === BuildingType.FISHERMAN) return { valid: false, reason: "Aucune eau à proximité" };
                if (type === BuildingType.LUMBER_HUT) return { valid: false, reason: "Aucune forêt à proximité" };
            }
        }

        if (engine.resources.money < specs.cost) {
            return { valid: false, reason: `Fonds insuffisants (coût: ${specs.cost}$)` };
        }

        const hasRoad = this.isNextToRoad(engine, index);
        if (!hasRoad) {
            advisorStore.triggerAdvice("Impossible de bâtir ici, Maire ! Il faut absolument coller le bâtiment à une route pour qu'il soit relié aux services.", true);
            return { valid: false, reason: "Doit être adjacent à une route" };
        }

        return { valid: true };
    }
}
