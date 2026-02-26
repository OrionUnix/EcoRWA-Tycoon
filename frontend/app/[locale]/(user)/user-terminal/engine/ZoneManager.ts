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

        // Debug neighbors
        neighbors.forEach((nVal, i) => {
            if (nVal !== -1) {
                const hasRoad = engine.roadLayer[nVal] !== null;
                // console.log(`Neighbor ${i} (idx ${nVal}): Road=${hasRoad ? 'YES' : 'NO'}`);
            }
        });

        // Console log seulement si pas de route trouvée pour ne pas spammer, ou sur demande

        neighbors.forEach((nVal, i) => {
            if (nVal !== -1) {
                // console.log(`Neighbor ${i} (idx ${nVal}): Road=${engine.roadLayer[nVal] ? 'YES' : 'NO'}`);
            }
        });

        // VRAI DEBUG
        const valid = neighbors.some(nIdx => nIdx !== -1 && engine.roadLayer[nIdx] !== null);
        if (!valid) {
            console.log(`🛣️ ZoneManager Check: Index ${index} (x:${x}, y:${y}). Neighbors: ${neighbors.map(n => n === -1 ? 'OUT' : `${n}(${engine.roadLayer[n] ? 'R' : '_'})`).join(', ')}`);
        }
        return valid;

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
        if (engine.zoningLayer[index] !== null) {
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
            advisorStore.triggerAdvice("Impossible de bâtir ici, Maire ! Il faut absolument coller le bâtiment à une route pour qu'il soit relié aux services.", true);
            return { valid: false, reason: "Doit être adjacent à une route" };
        }

        console.log('✅ Validation: SUCCÈS - zonage autorisé');
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

        // Coût du zonage
        const cost = 10;
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
