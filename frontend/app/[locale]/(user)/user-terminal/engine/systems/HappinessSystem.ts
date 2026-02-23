import { MapEngine } from '../MapEngine';
import { BuildingType, BuildingStatus, ZoneType, BUILDING_SPECS } from '../types';
import { PopulationManager } from './PopulationManager';

export class HappinessSystem {

    /**
     * Mise à jour globale du bonheur et de la désirabilité
     */
    public static update(map: MapEngine) {
        const grid = map.buildingLayer;
        const width = map.config.size;

        // 1. GLOBAL STATE CHECK
        // Est-ce qu'on a de l'industrie ou un marché pour les commerces ?
        // On scanne rapidement la ville
        let hasIndustryOrMarket = false;

        // Optimisation: On pourrait stocker ça dans CityStats, mais pour l'instant on scanne
        for (let i = 0; i < grid.length; i++) {
            if (grid[i]) {
                if (grid[i]!.type === BuildingType.INDUSTRIAL || grid[i]!.type === BuildingType.FOOD_MARKET) {
                    hasIndustryOrMarket = true;
                    break;
                }
            }
        }

        // 2. ITERATION SUR LES BÂTIMENTS
        for (let i = 0; i < grid.length; i++) {
            const building = grid[i];
            if (!building) continue;

            const x = i % width;
            const y = Math.floor(i / width);

            // A. LOGIQUE COMMERCIALE
            if (building.type === BuildingType.COMMERCIAL) {
                let score = 50;

                if (!hasIndustryOrMarket) {
                    score -= 30; // Pénalité si pas de marchandises
                    building.statusFlags |= BuildingStatus.NO_GOODS;
                } else {
                    building.statusFlags &= ~BuildingStatus.NO_GOODS;
                }

                // Besoins de base
                if (building.statusFlags & BuildingStatus.NO_WATER) score -= 30;
                if (building.statusFlags & BuildingStatus.NO_POWER) score -= 30;

                // Taxes commerciales
                const taxCom = map.stats.budget.taxRate?.commercial || 9;
                if (taxCom > 10) score -= (taxCom - 10) * 2; // -2% par point au dessus de 10%
                else if (taxCom < 5) score += 5; // Bonus si taxes basses

                score += this.calculateLocalInfluence(map, x, y);
                building.happiness = Math.max(0, Math.min(100, score));

                if (building.happiness === 0) building.state = 'ABANDONED';
            }

            // B. LOGIQUE RÉSIDENTIELLE
            if (building.type === BuildingType.RESIDENTIAL) {
                let score = 50; // Base score (Neutral)

                // 2.1 BESOINS DE BASE (Facteur Majeur)
                if (building.statusFlags & BuildingStatus.NO_WATER) score -= 30;
                if (building.statusFlags & BuildingStatus.NO_POWER) score -= 30;
                if (building.statusFlags & BuildingStatus.NO_FOOD) score -= 15;
                if (building.statusFlags & BuildingStatus.NO_JOBS) score -= 15;

                // 2.2 TAXES RÉSIDENTIELLES
                const taxRes = map.stats.budget.taxRate?.residential || 9;
                if (taxRes > 10) score -= (taxRes - 10) * 3; // -3% par point au dessus de 10%
                else if (taxRes < 5) score += 10; // Bonus si taxes très basses

                // 2.3 INFLUENCE LOCALE (AoE Scan)
                // On regarde autour pour trouver des Services ou de la Pollution
                const localInfluence = this.calculateLocalInfluence(map, x, y);
                score += localInfluence;

                // Clamp
                score = Math.max(0, Math.min(100, score));

                building.happiness = score;
            }
        }
    }

    /**
     * Calcule le score d'influence cumulé aux coordonnées (x,y)
     */
    private static calculateLocalInfluence(map: MapEngine, cx: number, cy: number): number {
        let totalInfluence = 0;
        const RADIUS = 15; // Rayon max de recherche (peut être optimisé)

        // Limites du scan
        const startX = Math.max(0, cx - RADIUS);
        const endX = Math.min(map.config.size - 1, cx + RADIUS);
        const startY = Math.max(0, cy - RADIUS);
        const endY = Math.min(map.config.size - 1, cy + RADIUS);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const idx = y * map.config.size + x;
                const neighbor = map.buildingLayer[idx];

                if (neighbor && neighbor.state === 'ACTIVE') {
                    const specs = BUILDING_SPECS[neighbor.type];

                    if (specs && specs.influenceRadius && specs.influenceScore) {
                        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

                        if (dist <= specs.influenceRadius) {
                            // L'influence diminue avec la distance ? Ou est constante dans le rayon ?
                            // SimCity classique : Constante ou linéaire.
                            // Faisons Linéaire : 100% à 0m, 0% à Radius.

                            // Problème : Pollution industrielle doit être forte même un peu loin. 
                            // Simplification V1 : Constante dans le rayon.
                            totalInfluence += specs.influenceScore;
                        }
                    }
                }
            }
        }

        return totalInfluence;
    }
}
