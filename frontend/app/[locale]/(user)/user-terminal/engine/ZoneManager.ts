import { advisorStore } from '../store/AdvisorStore';
import { MapEngine } from './MapEngine';
import { ZoneType, ZoneData } from './types';
import { GRID_SIZE } from './config';
import { ResourceRenderer } from './ResourceRenderer';
import { WildlifeRenderer } from './WildlifeRenderer';

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

        return neighbors.some(nIdx => {
            if (nIdx !== -1) {
                const road = engine.roadLayer[nIdx];
                return road !== null && road.isConnectedToMain === true;
            }
            return false;
        });
    }

    /**
     * Vérifie si le zonage est possible sur cette case
     */
    static checkZoneValidity(engine: MapEngine, index: number, type: ZoneType): { valid: boolean, reason?: string } {
        if (index < 0 || index >= engine.config.totalCells)
            return { valid: false, reason: "Hors carte" };
        if (engine.buildingLayer[index])
            return { valid: false, reason: "Occupé par un bâtiment" };
        if (engine.roadLayer[index])
            return { valid: false, reason: "Impossible de zoner sur la route" };
        if (engine.zoningLayer[index] !== null)
            return { valid: false, reason: "Une zone est déjà placée ici" };

        const isWater = engine.getLayer(1)[index] > 0.3;
        if (isWater)
            return { valid: false, reason: "Impossible de zoner sur l'eau" };

        const hasRoad = this.isNextToRoad(engine, index);
        if (!hasRoad)
            return { valid: false, reason: "Doit être relié au réseau routier principal" };

        return { valid: true };
    }

    /**
     * Place une zone après validation
     */
    static placeZone(engine: MapEngine, index: number, type: ZoneType): { success: boolean, message?: string, zoneData?: ZoneData } {
        const check = this.checkZoneValidity(engine, index, type);

        if (!check.valid) {
            console.log(`❌ ZoneManager: ${check.reason}`);
            return { success: false, message: check.reason };
        }

        // Coût du zonage (GRATUIT en early game)
        const cost = 0;
        if (engine.resources.money < cost) {
            console.log(`❌ ZoneManager: Fonds insuffisants (${engine.resources.money}$ < ${cost}$)`);
            return { success: false, message: `Fonds insuffisants (coût: ${cost}$)` };
        }

        // Déduction du coût
        engine.resources.money -= cost;

        // Création des données de zone avec population initiale
        const zoneData: ZoneData = {
            type: type,
            level: 1,
            population: type === ZoneType.RESIDENTIAL ? 5 : 0
        };

        // Placement de la zone
        engine.setZone(index, zoneData);

        // ✅ Nettoyage Nature (Arbres & Animaux)
        if (engine.resourceMaps.wood) engine.resourceMaps.wood[index] = 0;
        ResourceRenderer.removeResourceAt(index);
        WildlifeRenderer.removeWildlifeAt(index, engine);

        console.log(`✅ ZoneManager: Zone ${type} placée à index ${index}`);

        // ✅ Auto-Save : signal "le monde a changé"
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('city_mutated'));
        }

        return { success: true, message: `Zone ${type} créée.`, zoneData: zoneData };
    }
}
