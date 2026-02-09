// ✅ AJOUT DE BuildingType DANS LES IMPORTS
import { ZoneType, RoadData, LayerType, BuildingData, BuildingType } from '../types';

/**
 * ZoneSystem - Gestion du zonage
 * Gère l'assignation et la suppression des zones R/C/I
 */
export class ZoneSystem {

    /**
     * Définit une zone sur une tuile
     */
    static setZone(
        index: number,
        type: ZoneType,
        zoningLayer: ZoneType[],
        buildingLayer: (BuildingData | null)[],
        roadLayer: (RoadData | null)[],
        waterLayer: Float32Array
    ): boolean {
        // Validation basique
        // (Assure-toi que waterLayer est bien défini, sinon retire cette ligne)
        const isWater = waterLayer && waterLayer[index] > 0.3;
        const hasRoad = roadLayer[index] !== null;

        // On ne peut pas zoner sur l'eau ou sur une route
        if (isWater || hasRoad) {
            return false;
        }

        // Appliquer le zonage
        zoningLayer[index] = type;

        // GESTION DU CONFLIT DE TYPE ICI
        // Si il y a déjà un bâtiment, on vérifie s'il correspond à la nouvelle zone
        if (buildingLayer[index]) {
            const currentBuilding = buildingLayer[index]!;

            // 1. On détermine quel BuildingType correspond à la nouvelle Zone
            let expectedType: BuildingType | null = null;

            switch (type) {
                case ZoneType.RESIDENTIAL:
                    expectedType = BuildingType.RESIDENTIAL;
                    break;
                case ZoneType.COMMERCIAL:
                    expectedType = BuildingType.COMMERCIAL;
                    break;
                case ZoneType.INDUSTRIAL:
                    expectedType = BuildingType.INDUSTRIAL;
                    break;
                // Si c'est ZoneType.NONE ou autre, expectedType reste null
            }

            // 2. Si le bâtiment actuel ne correspond pas à la zone prévue, on le détruit
            // (Ex: On zone Industriel sur une Maison -> La maison disparait)
            if (currentBuilding.type !== expectedType) {
                buildingLayer[index] = null;
            }
        }

        return true;
    }

    /**
     * Supprime une zone (et le bâtiment associé)
     */
    static removeZone(
        index: number,
        zoningLayer: ZoneType[],
        buildingLayer: (BuildingData | null)[]
    ): void {
        zoningLayer[index] = ZoneType.NONE;
        buildingLayer[index] = null;
    }

    /**
     * Vérifie si une tuile est zonée
     */
    static isZoned(index: number, zoningLayer: ZoneType[]): boolean {
        return zoningLayer[index] !== ZoneType.NONE;
    }
}