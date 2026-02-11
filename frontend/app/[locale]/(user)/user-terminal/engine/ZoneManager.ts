import { MapEngine } from './MapEngine';
import { ZoneType } from './types';
import { GRID_SIZE } from './config';

/**
 * Gère les opérations liées aux ZONES (Résidentiel, Commercial, Industriel)
 */
export class ZoneManager {
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
     * Vérifie si le zonage est possible sur cette case
     */
    static checkZoneValidity(engine: MapEngine, index: number, type: ZoneType): { valid: boolean, reason?: string } {
        console.log(`🔍 ZoneManager: Vérification zonage ${type} à index ${index}`);

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
            return { valid: false, reason: "Impossible de zoner sur la route" };
        }

        // 4. Case déjà zonée ?
        if (engine.zoningLayer[index] !== ZoneType.NONE) {
            console.log('❌ Validation: Zone existante:', engine.zoningLayer[index]);
            return { valid: false, reason: "Une zone est déjà placée ici" };
        }

        // 5. AUCUNE zone sur l'eau (règle stricte)
        const waterLevel = engine.getLayer(1)[index];
        const isWater = waterLevel > 0.3;
        console.log(`🌊 Validation: waterLevel=${waterLevel.toFixed(2)}, isWater=${isWater}`);
        if (isWater) {
            console.log('❌ Validation: Sur l\'eau');
            return { valid: false, reason: "Impossible de zoner sur l'eau" };
        }

        // 6. TOUTES LES ZONES DOIVENT ÊTRE ADJACENTES À UNE ROUTE (règle stricte)
        const hasRoad = this.isNextToRoad(engine, index);
        console.log(`🛣️ Validation: hasAdjacentRoad=${hasRoad}`);
        if (!hasRoad) {
            console.log('❌ Validation: Pas de route adjacente');
            return { valid: false, reason: "Doit être adjacent à une route" };
        }

        console.log('✅ Validation: SUCCÈS - zonage autorisé');
        return { valid: true };
    }

    /**
     * Place une zone après validation
     */
    static placeZone(engine: MapEngine, index: number, type: ZoneType): { success: boolean, message?: string } {
        const check = this.checkZoneValidity(engine, index, type);

        if (!check.valid) {
            console.log(`❌ ZoneManager: ${check.reason}`);
            return { success: false, message: check.reason };
        }

        // Coût du zonage
        const cost = 10;
        if (engine.resources.money < cost) {
            console.log(`❌ ZoneManager: Fonds insuffisants (${engine.resources.money}$ < ${cost}$)`);
            return { success: false, message: `Fonds insuffisants (coût: ${cost}$)` };
        }

        // Déduction du coût
        engine.resources.money -= cost;

        // Placement de la zone
        engine.setZone(index, type);

        console.log(`✅ ZoneManager: Zone ${type} placée à index ${index}`);
        return { success: true, message: `Zone ${type} créée.` };
    }
}
