import { MapEngine } from '../engine/MapEngine';
import { BiomeType, LayerType } from '../engine/types';

/**
 * Récupère TOUTES les informations d'une tuile pour l'inspecteur (Tooltip UI)
 */
export function getResourceAtTile(engine: MapEngine, index: number, viewMode: string) {
    // Sécurité
    if (!engine || index < 0 || index >= engine.config.totalCells) return null;

    // 1. Récupération des ressources brutes (0.0 à 1.0)
    const resources = {
        oil: engine.resourceMaps.oil[index],
        coal: engine.resourceMaps.coal[index],
        iron: engine.resourceMaps.iron[index],
        wood: engine.resourceMaps.wood[index],
        animals: engine.resourceMaps.animals[index],
        fish: engine.resourceMaps.fish[index]
    };

    // 2. Récupération des données géographiques
    const biomeId = engine.biomes[index];
    const elevation = engine.heightMap[index];
    const moisture = engine.moistureMap[index]; // ✅ C'est ça qui manquait pour l'eau souterraine !
    const waterDepth = engine.getLayer(LayerType.WATER)[index];

    // 3. Construction de l'objet de réponse pour GameUI
    return {

        biome: BiomeType[biomeId],
        elevation: elevation,
        moisture: moisture,
        water: waterDepth,

        resources: resources
    };
}