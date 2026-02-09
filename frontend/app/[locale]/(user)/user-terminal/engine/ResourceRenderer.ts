import * as PIXI from 'pixi.js';
import { ResourceAssets } from './ResourceAssets';
import { MapEngine } from './MapEngine';
import { BiomeType } from './types';
import { TILE_HEIGHT } from './config';

// On utilise Sprite simple (pas d'animation)
const resourceCache = new Map<number, PIXI.Sprite>();

export class ResourceRenderer {

    static removeResourceAt(i: number) {
        const sprite = resourceCache.get(i);
        if (sprite) {
            if (sprite.parent) {
                sprite.parent.removeChild(sprite);
            }
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

        // --- CONDITIONS STRICTES ---
        const hasRoad = engine.roadLayer && engine.roadLayer[i] !== null;
        const hasBuilding = engine.buildingLayer && engine.buildingLayer[i] !== null;

        // 🔒 Sécurité absolue : Biome Forêt UNIQUEMENT
        const isForest = (biome === BiomeType.FOREST);

        const shouldShow = isForest && woodAmount > 0.1 && !hasRoad && !hasBuilding;

        if (shouldShow) {
            // A. CRÉATION (Si le sprite n'existe pas encore)
            if (!sprite) {
                if (ResourceAssets.forestFrames.length === 0) return;

                // 1. Choix d'une image fixe basée sur la position (pseudo-aléatoire stable)
                // Cela permet d'avoir des arbres différents mais qui ne changent pas quand on bouge la caméra
                const frameIndex = i % ResourceAssets.forestFrames.length;

                sprite = new PIXI.Sprite(ResourceAssets.forestFrames[frameIndex]);

                // 2. Ancrage précis
                // 0.5 = Centre horizontal
                // 0.9 = Le pied de l'arbre est posé sur le centre de la tuile
                sprite.anchor.set(0.5, 0.9);

                // 3. Variation de taille (Skalé)
                // On génère une échelle entre 0.85 (petit) et 1.15 (grand)
                // On utilise 'i' pour que le hasard soit toujours le même pour cet arbre
                const randomSeed = Math.sin(i) * 10000;
                const scale = 0.85 + (Math.abs(randomSeed % 1) * 0.3);

                // 4. Application de la taille
                // On part de 58px pour éviter que l'arbre ne "bave" trop sur les cases voisines
                sprite.width = 58 * scale;
                sprite.height = 58 * scale;

                container.addChild(sprite);
                resourceCache.set(i, sprite);
            }

            // B. MISE À JOUR POSITION
            sprite.visible = true;
            sprite.x = pos.x;

            // ✅ CORRECTION CRITIQUE : En isométrique, pos.y est le CENTRE du losange
            // Le pied de l'arbre doit être au BAS du losange (pos.y + TILE_HEIGHT/2)
            // Avec anchor.y = 0.9, le point d'ancrage est déjà proche du pied
            // Donc on positionne le sprite au bas de la tuile
            sprite.y = pos.y + (TILE_HEIGHT / 2);

            // Profondeur : +10 assure qu'il est devant le sol
            sprite.zIndex = pos.y + 10;

        } else {
            // C. NETTOYAGE
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