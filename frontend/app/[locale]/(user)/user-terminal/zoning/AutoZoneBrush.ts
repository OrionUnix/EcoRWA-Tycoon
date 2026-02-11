import { MapEngine } from '../engine/MapEngine';
import { ZoneType } from '../engine/types';
import { TileUtils } from '../engine/TileUtils';

/**
 * Pinceau de zonage automatique (Cities Skylines style)
 * Permet de peindre directement des zones R/C/I en glissant la souris
 */
export class AutoZoneBrush {
    /**
     * Peint une zone sur une tuile (application immédiate, pas de popup)
     * @param engine Instance du moteur de carte
     * @param index Index de la tuile à zoner
     * @param type Type de zone (RESIDENTIAL, COMMERCIAL, INDUSTRIAL)
     * @returns true si la zone a été placée, false sinon
     */
    static paintZone(engine: MapEngine, index: number, type: ZoneType): boolean {
        // Validation
        if (!this.isValidZoneTile(engine, index)) {
            return false;
        }

        // Application directe de la zone
        engine.setZone(index, type);
        console.log(`🎨 AutoZoneBrush: Zone ${type} peinte à l'index ${index}`);
        return true;
    }

    /**
     * Vérifie si une tuile peut recevoir une zone
     * Règles strictes comme Cities Skylines
     */
    static isValidZoneTile(engine: MapEngine, index: number): boolean {
        // 1. Index valide ?
        if (!TileUtils.isValidIndex(index)) {
            return false;
        }

        // 2. Pas sur une route
        if (engine.roadLayer[index]) {
            console.log(`⚠️ AutoZoneBrush: Case ${index} est une route`);
            return false;
        }

        // 3. Pas sur un bâtiment existant
        if (engine.buildingLayer[index]) {
            console.log(`⚠️ AutoZoneBrush: Case ${index} a déjà un bâtiment`);
            return false;
        }

        // 4. Pas déjà zoné (on peut repeindre par-dessus)
        // NOTE: Dans Cities Skylines, on peut changer le type de zone
        // Pour l'instant, on l'autorise aussi
        // if (engine.zoningLayer[index] !== ZoneType.NONE) {
        //     return false;
        // }

        // 5. Pas d'eau
        const waterLevel = engine.getLayer(1)[index];
        if (waterLevel > 0.3) {
            console.log(`⚠️ AutoZoneBrush: Case ${index} est de l'eau`);
            return false;
        }

        // 6. RÈGLE CRITIQUE : Doit être adjacent à une route
        const neighbors = TileUtils.getNeighbors(index);
        const hasAdjacentRoad = neighbors.some(n => engine.roadLayer[n]);

        if (!hasAdjacentRoad) {
            console.log(`⚠️ AutoZoneBrush: Case ${index} n'est pas adjacente à une route`);
            return false;
        }

        return true;
    }

    /**
     * Peint plusieurs zones en une seule opération (pour drag painting)
     * @param engine Instance du moteur
     * @param indices Liste des indices à peindre
     * @param type Type de zone
     * @returns Nombre de zones effectivement peintes
     */
    static paintMultipleZones(engine: MapEngine, indices: number[], type: ZoneType): number {
        let painted = 0;

        for (const idx of indices) {
            if (this.paintZone(engine, idx, type)) {
                painted++;
            }
        }

        if (painted > 0) {
            engine.revision++; // Force le rendu
            console.log(`✅ AutoZoneBrush: ${painted}/${indices.length} zones peintes`);
        }

        return painted;
    }
}
