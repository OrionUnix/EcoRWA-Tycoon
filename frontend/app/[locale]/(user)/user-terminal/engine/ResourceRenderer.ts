import * as PIXI from 'pixi.js';
import { ResourceAssets } from './ResourceAssets';
import { MapEngine } from './MapEngine';
import { BiomeType } from './types';
import { TILE_HEIGHT, GRID_SIZE } from './config'; // Ajout GRID_SIZE

const resourceCache = new Map<number, PIXI.Sprite>();

export class ResourceRenderer {

    static removeResourceAt(i: number) {
        const sprite = resourceCache.get(i);
        if (sprite) {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy();
            resourceCache.delete(i);
        }
    }

    static drawResource(
        container: PIXI.Container,
        engine: MapEngine,
        i: number,
        pos: { x: number, y: number },
        woodAmount: number,
        biome: number
    ) {
        let sprite = resourceCache.get(i);

        const hasRoad = engine.roadLayer && engine.roadLayer[i] !== null;
        const hasBuilding = engine.buildingLayer && engine.buildingLayer[i] !== null;
        const isForest = (biome === BiomeType.FOREST);
        const shouldShow = isForest && woodAmount > 0.1 && !hasRoad && !hasBuilding;

        if (shouldShow) {
            if (!sprite) {
                if (ResourceAssets.forestFrames.length === 0) return;
                const frameIndex = i % ResourceAssets.forestFrames.length;
                sprite = new PIXI.Sprite(ResourceAssets.forestFrames[frameIndex]);

                // Ancrage pour que les pieds de l'arbre soient au bas de l'image
                sprite.anchor.set(0.5, 0.9);

                const randomSeed = Math.sin(i) * 10000;
                const scale = 0.85 + (Math.abs(randomSeed % 1) * 0.3);
                sprite.width = 58 * scale;
                sprite.height = 58 * scale;

                container.addChild(sprite);
                resourceCache.set(i, sprite);
            }

            sprite.visible = true;
            sprite.x = pos.x;

            // Position Y : Bas de la tuile
            sprite.y = pos.y + (TILE_HEIGHT / 2);

            // ✅ CALCUL Z-INDEX UNIFIÉ
            // On recalcule x et y depuis i
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);

            // Z-Index = x + y + 0.5
            // 0.5 permet d'être DEVANT la route de la MÊME case (qui est à 0.1)
            // Mais DERRIÈRE la route de la case suivante (qui sera à x+y+1 + 0.1)
            sprite.zIndex = x + y + 0.5;

        } else {
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