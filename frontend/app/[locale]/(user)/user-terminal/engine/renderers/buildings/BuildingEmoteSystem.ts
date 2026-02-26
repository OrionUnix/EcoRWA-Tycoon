import { BuildingData } from '../../types';

// ═══════════════════════════════════════════════════════
// BuildingEmoteSystem
// Déduit l'icône de statut/satisfaction d'un bâtiment 
// (Travail, Électricité, Eau, Ruine)
// ═══════════════════════════════════════════════════════

export class BuildingEmoteSystem {
    /**
     * Retourne l'emoji système à afficher au dessus du bâtiment.
     */
    static getEmote(building: BuildingData): string | null {
        // 1. État de destruction/ruine
        if (building.state === 'ABANDONED') return '⬇️';

        // 2. État de construction ou d'amélioration
        if (building.state === 'CONSTRUCTION') {
            if (building.level > 1) {
                return '⬆️'; // Upgrading
            } else {
                return '🚧'; // Construcing
            }
        }

        // 3. Problèmes de besoins (Bitmask `statusFlags`)
        // 1 = NO_WATER, 2 = NO_POWER, 4 = NO_FOOD, 8 = NO_JOBS, 16 = UNHAPPY, 32 = ABANDONED
        const flags = building.statusFlags;
        if ((flags & 1) !== 0) return '💧'; // Pas d'eau
        if ((flags & 2) !== 0) return '⚡'; // Pas de courant
        if ((flags & 4) !== 0) return '🍞'; // Pas de nourriture
        if ((flags & 8) !== 0) return '💼'; // Pas d'emplois / Employeurs sans travailleurs
        if ((flags & 16) !== 0) return '😡'; // Citoyens mécontents

        return null; // Tout va bien
    }
}
