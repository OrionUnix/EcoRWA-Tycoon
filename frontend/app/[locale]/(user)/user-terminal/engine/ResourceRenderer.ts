import * as PIXI from 'pixi.js';
import { ResourceAssets } from './ResourceAssets';
import { MapEngine } from './MapEngine';
import { BiomeType } from './types';

const resourceCache = new Map<number, PIXI.AnimatedSprite>();

export class ResourceRenderer {
    static drawResource(
        container: PIXI.Container,
        engine: MapEngine,
        i: number,
        pos: { x: number, y: number },
        woodAmount: number,
        biome: number
    ) {
        // 1. D'abord, on récupère le sprite existant dans le cache
        let sprite = resourceCache.get(i);

        // 2. On définit les conditions strictes
        const hasRoad = engine.roadLayer && engine.roadLayer[i] !== null;
        const hasBuilding = engine.buildingLayer && engine.buildingLayer[i] !== null;
        const isForest = (biome === BiomeType.FOREST);

        // L'arbre ne s'affiche QUE si c'est une forêt, avec du bois, sans route ni bâtiment
        const shouldShow = isForest && woodAmount > 0.1 && !hasRoad && !hasBuilding;

        if (shouldShow) {
            if (!sprite) {
                if (ResourceAssets.forestFrames.length === 0) return;

                sprite = new PIXI.AnimatedSprite(ResourceAssets.forestFrames);

                // Ancrage au pied des troncs
                sprite.anchor.set(0.5, 0.85);
                sprite.animationSpeed = 0.005 + Math.random() * 0.005;
                sprite.play();
                sprite.width = 72;
                sprite.height = 72;

                container.addChild(sprite);
                resourceCache.set(i, sprite);
            }

            // Mise à jour visuelle
            sprite.visible = true;
            sprite.x = pos.x;
            sprite.y = pos.y;
            sprite.zIndex = pos.y + 10;

        } else {
            // 3. Si on ne doit pas afficher (Mauvais biome, route, etc.)
            // On nettoie le sprite s'il existait
            if (sprite) {
                container.removeChild(sprite);
                sprite.destroy();
                resourceCache.delete(i);
            }
        }
    }

    static clearAll(container: PIXI.Container) {
        resourceCache.forEach((sprite) => {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy();
        });
        resourceCache.clear();
    }
}