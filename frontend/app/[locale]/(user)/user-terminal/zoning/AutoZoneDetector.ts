import { MapEngine } from '../engine/MapEngine';
import { ZoneType } from '../engine/types';
import { TileUtils } from '../engine/TileUtils';

export interface ZoneSuggestion {
    index: number;
    type: ZoneType;
    score: number;
}

/**
 * Détecteur automatique de zones basé sur les routes
 * Inspiré de SimCity/Cities Skylines
 */
export class AutoZoneDetector {
    /**
     * Scanne toutes les cases adjacentes aux routes spécifiées
     * @param engine Instance du moteur de carte
     * @param roadIndices Indices des tuiles de route récemment placées
     * @returns Liste des indices de cases constructibles
     */
    static scanNearbyTiles(engine: MapEngine, roadIndices: number[]): number[] {
        console.log(`🔍 AutoZoneDetector: Scanning ${roadIndices.length} road tiles`);

        const buildable: Set<number> = new Set();

        for (const roadIdx of roadIndices) {
            const neighbors = TileUtils.getNeighbors(roadIdx);

            for (const nIdx of neighbors) {
                if (this.isBuildable(engine, nIdx)) {
                    buildable.add(nIdx);
                }
            }
        }

        const result = Array.from(buildable);
        console.log(`✅ AutoZoneDetector: Found ${result.length} buildable spots`);
        return result;
    }

    /**
     * Vérifie si une case est constructible pour une zone
     */
    static isBuildable(engine: MapEngine, index: number): boolean {
        // 1. Index valide ?
        if (!TileUtils.isValidIndex(index)) {
            return false;
        }

        // 2. Pas de bâtiment existant
        if (engine.buildingLayer[index]) {
            return false;
        }

        // 3. Pas de route (zones ADJACENTES, pas SUR la route)
        if (engine.roadLayer[index]) {
            return false;
        }

        // 4. Pas déjà zoné
        if (engine.zoningLayer[index] !== ZoneType.NONE) {
            return false;
        }

        // 5. Pas d'eau
        const waterLevel = engine.getLayer(1)[index];
        if (waterLevel > 0.3) {
            return false;
        }

        // 6. Forêt = destructible automatiquement
        // On accepte les forêts (arbres seront détruits au placement)

        return true;
    }

    /**
     * Génère des suggestions de zones selon la demande
     * @param engine Instance du moteur
     * @param buildableSpots Indices des cases constructibles
     * @returns Liste de suggestions avec type et score
     */
    static suggestZones(engine: MapEngine, buildableSpots: number[]): ZoneSuggestion[] {
        console.log(`💡 AutoZoneDetector: Generating suggestions for ${buildableSpots.length} spots`);

        // Récupérer la demande R/C/I
        const demand = this.getDemand(engine);
        console.log(`📊 Demand - R:${demand.R.toFixed(2)} C:${demand.C.toFixed(2)} I:${demand.I.toFixed(2)}`);

        const suggestions: ZoneSuggestion[] = [];

        // Algorithme simple : distribuer selon ratio de demande
        let residentialCount = Math.floor(buildableSpots.length * demand.R);
        let commercialCount = Math.floor(buildableSpots.length * demand.C);
        let industrialCount = buildableSpots.length - residentialCount - commercialCount;

        for (let i = 0; i < buildableSpots.length; i++) {
            let type: ZoneType;
            let score: number;

            if (i < residentialCount) {
                type = ZoneType.RESIDENTIAL;
                score = demand.R;
            } else if (i < residentialCount + commercialCount) {
                type = ZoneType.COMMERCIAL;
                score = demand.C;
            } else {
                type = ZoneType.INDUSTRIAL;
                score = demand.I;
            }

            suggestions.push({
                index: buildableSpots[i],
                type,
                score
            });

            console.log(`  → Zone ${type} at index ${buildableSpots[i]} (score: ${score.toFixed(2)})`);
        }

        console.log(`✅ AutoZoneDetector: ${suggestions.length} suggestions generated (WAITING for player validation)`);
        return suggestions;
    }

    /**
     * ⚠️ CRITICAL: Applique les zones UNIQUEMENT après validation du joueur
     * Ne JAMAIS appeler automatiquement !
     */
    static applyZones(engine: MapEngine, suggestions: ZoneSuggestion[]): void {
        console.log(`🏗️ AutoZoneDetector: Applying ${suggestions.length} zones (PLAYER VALIDATED)`);

        let applied = 0;
        for (const { index, type } of suggestions) {
            // Vérifier que la case est toujours constructible
            if (this.isBuildable(engine, index)) {
                engine.setZone(index, type);
                applied++;
            }
        }

        engine.revision++;
        console.log(`✅ AutoZoneDetector: ${applied}/${suggestions.length} zones applied`);
    }

    /**
     * Calcule la demande R/C/I
     * TODO: Implémenter logique réelle basée sur population, emploi, etc.
     */
    private static getDemand(engine: MapEngine): { R: number, C: number, I: number } {
        // Pour l'instant, ratio simple
        // TODO: Lier à engine.stats pour demande réelle
        return {
            R: 0.50,  // 50% résidentiel
            C: 0.30,  // 30% commercial
            I: 0.20   // 20% industriel
        };
    }
}
