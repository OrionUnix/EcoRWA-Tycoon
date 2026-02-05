import { ZoneType, RoadData, LayerType, BuildingData } from '../types';

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
        const isWater = waterLayer[index] > 0.3;
        const hasRoad = roadLayer[index] !== null;

        // On ne peut pas zoner sur l'eau ou sur une route
        if (isWater || hasRoad) {
            return false;
        }

        // Appliquer le zonage
        zoningLayer[index] = type;

        // Si on change de type de zone, on détruit le bâtiment existant s'il n'est plus compatible
        if (buildingLayer[index] && buildingLayer[index]!.type !== type) {
            buildingLayer[index] = null;
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
