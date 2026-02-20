import * as PIXI from 'pixi.js';
import { MapEngine } from './MapEngine';
import { TILE_HEIGHT, GRID_SIZE, TILE_WIDTH, SURFACE_Y_OFFSET } from './config';
import { asset } from '../utils/assetUtils';

// ═══════════════════════════════════════════════════════
// WildlifeRenderer — Faune Animée (Gibier)
// ═══════════════════════════════════════════════════════

const wildlifeCache = new Map<number, PIXI.AnimatedSprite>();

// ✅ NOUVELLE CONFIGURATION : Nombre exact de frames calculées
const ANIMAL_CONFIG = {
    cerf: { url: '/assets/isometric/Spritesheet/resources/animals/cerf/critter_stag_NE_idle.png', frames: 24 }, // 768 / 32 = 24
    cerf2: { url: '/assets/isometric/Spritesheet/resources/animals/cerf/critter_stag_SW_idle.png', frames: 24 }, // 768 / 32 = 24
    cerf_run: { url: '/assets/isometric/Spritesheet/resources/animals/cerf/critter_stag_NE_run.png', frames: 10 },
    cerf2_run: { url: '/assets/isometric/Spritesheet/resources/animals/cerf/critter_stag_SW_run.png', frames: 10 },
    sanglier: { url: '/assets/isometric/Spritesheet/resources/animals/boar/boar_NE_idle_strip.png', frames: 7 }, // 287 / 41 = 7
    sanglier_run: { url: '/assets/isometric/Spritesheet/resources/animals/boar/boar_NE_run_strip.png', frames: 4 }, // 164 / 41 = 4
    blaireau: { url: '/assets/isometric/Spritesheet/resources/animals/badger/critter_badger_NE_idle.png', frames: 22 }, // 924 / 42 = 22
    blaireau_run: { url: '/assets/isometric/Spritesheet/resources/animals/badger/critter_badger_NE_walk.png', frames: 9 } // 378 / 42 = 9
};

const animalAnimations: Record<string, PIXI.Texture[]> = {};
let wildlifeLoading = false;
/**
 * Charge un "strip" PNG et le découpe en frames d'animation.
 * S'adapte dynamiquement à la taille de l'animal.
 */
async function sliceStrip(url: string, numFrames: number): Promise<PIXI.Texture[]> {
    try {
        const tex = await PIXI.Assets.load(asset(url));
        if (!tex) return [];
        if (tex.source) tex.source.scaleMode = 'nearest'; // Pixel art net

        const frames: PIXI.Texture[] = [];

        // ✅ L'ÉQUATION INFAILLIBLE : Largeur totale divisée par le nombre de frames
        const frameWidth = tex.width / numFrames;
        const frameHeight = tex.height; // On garde la hauteur totale de l'image

        for (let i = 0; i < numFrames; i++) {
            const rect = new PIXI.Rectangle(
                i * frameWidth, // Position X parfaitement calculée
                0,
                frameWidth,     // Largeur exacte de la frame
                frameHeight     // Hauteur exacte
            );

            const frameTexture = new PIXI.Texture({
                source: tex.source,
                frame: rect
            });

            frames.push(frameTexture);
        }
        return frames;
    } catch (e) {
        console.error("Erreur de chargement du strip animal:", url, e);
        return [];
    }
}

export async function loadWildlifeTextures(): Promise<void> {
    if (wildlifeLoading || Object.keys(animalAnimations).length > 0) return;
    wildlifeLoading = true;

    // ✅ On passe maintenant l'URL ET le nombre de frames à la fonction
    animalAnimations['cerf'] = await sliceStrip(ANIMAL_CONFIG.cerf.url, ANIMAL_CONFIG.cerf.frames);
    animalAnimations['cerf2'] = await sliceStrip(ANIMAL_CONFIG.cerf2.url, ANIMAL_CONFIG.cerf2.frames);
    animalAnimations['cerf_run'] = await sliceStrip(ANIMAL_CONFIG.cerf_run.url, ANIMAL_CONFIG.cerf_run.frames);
    animalAnimations['cerf2_run'] = await sliceStrip(ANIMAL_CONFIG.cerf2_run.url, ANIMAL_CONFIG.cerf2_run.frames);
    animalAnimations['sanglier'] = await sliceStrip(ANIMAL_CONFIG.sanglier.url, ANIMAL_CONFIG.sanglier.frames);
    animalAnimations['sanglier_run'] = await sliceStrip(ANIMAL_CONFIG.sanglier_run.url, ANIMAL_CONFIG.sanglier_run.frames);
    animalAnimations['blaireau'] = await sliceStrip(ANIMAL_CONFIG.blaireau.url, ANIMAL_CONFIG.blaireau.frames);
    animalAnimations['blaireau_run'] = await sliceStrip(ANIMAL_CONFIG.blaireau_run.url, ANIMAL_CONFIG.blaireau_run.frames);

    // Nettoyer les animations vides (échec de chargement)
    for (const key in animalAnimations) {
        if (animalAnimations[key].length === 0) {
            console.error(`❌ Échec du chargement pour : ${key}. Vérifiez le chemin du fichier !`);
            delete animalAnimations[key];
        } else {
            console.log(`✅ ${key} chargé avec succès ! (${animalAnimations[key].length} frames)`);
        }
    }

    console.log(`🦌 WildlifeRenderer: ${Object.keys(animalAnimations).length} types d'animaux prêts à spawn.`);
    wildlifeLoading = false;
}

export class WildlifeRenderer {
    static removeWildlifeAt(i: number) {
        const sprite = wildlifeCache.get(i);
        if (sprite) {
            // Si l'animal n'est pas déjà en train de fuir, on déclenche la fuite
            if (!(sprite as any).isFleeing) {
                const animalType = (sprite as any).animalType || 'cerf';
                WildlifeRenderer.fleeAnimal(sprite, i, animalType);
            } else {
                // S'il fuit déjà et qu'on le supprime de nouveau, alors on détruit
                if (sprite.parent) sprite.parent.removeChild(sprite);
                sprite.stop();
                sprite.destroy();
                wildlifeCache.delete(i);
            }
        }
    }

    static fleeAnimal(sprite: PIXI.AnimatedSprite, i: number, animalType: string) {
        if ((sprite as any).isFleeing) return;
        (sprite as any).isFleeing = true; // Marque en fuite

        // Retire du cache pour ne plus être re-ciblé par update
        wildlifeCache.delete(i);

        const runType = animalType + '_run';
        let runFrames = animalAnimations[runType];

        // Fallback s'il n'y a pas d'animation de course
        if (!runFrames || runFrames.length === 0) {
            runFrames = animalAnimations[animalType];
        }

        if (runFrames && runFrames.length > 0) {
            sprite.textures = runFrames;
            sprite.animationSpeed = 0.2; // Courir plus vite
            sprite.play();
        }

        // Objectif: une case à côté (en haut à droite isométriquement par ex)
        const targetX = sprite.x + TILE_WIDTH / 2;
        const targetY = sprite.y - TILE_HEIGHT / 2;

        const ticker = PIXI.Ticker.shared;
        const speed = 1.5;

        // Fonction d'animation ajoutée au Ticker
        const moveFlee = () => {
            if (sprite.destroyed) {
                ticker.remove(moveFlee);
                return;
            }

            const dx = targetX - sprite.x;
            const dy = targetY - sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Si arrivé à destination, on supprime l'animal
            if (dist < 3) {
                ticker.remove(moveFlee);
                if (sprite.parent) sprite.parent.removeChild(sprite);
                sprite.stop();
                sprite.destroy();
            } else {
                sprite.x += (dx / dist) * speed;
                sprite.y += (dy / dist) * speed;
            }
        };

        ticker.add(moveFlee);
    }

    static drawWildlife(
        container: PIXI.Container,
        engine: MapEngine,
        i: number,
        pos: { x: number, y: number },
        biome: number
    ) {
        let sprite = wildlifeCache.get(i);

        const hasRoad = engine.roadLayer && engine.roadLayer[i] !== null;
        const hasBuilding = engine.buildingLayer && engine.buildingLayer[i] !== null;
        const hasWood = engine.resourceMaps.wood && engine.resourceMaps.wood[i] > 0.5;

        // 1. On lit la valeur du gibier sur cette tuile
        const gibierValue = engine.resourceMaps.animals ? engine.resourceMaps.animals[i] : 0;

        // 2. LA NOUVELLE RÈGLE STRICTE :
        // - gibierValue > 0.85 : On force l'apparition uniquement là où la ressource est EXTRÊMEMENT concentrée.
        // - (i % 4 === 0) : Même dans la zone de gibier, on ne met un animal que sur 1 case sur 4. 
        // Cela crée des petits "troupeaux" naturels au lieu d'un tapis d'animaux collés.
        const hasAnimals = gibierValue > 0.85 && (i % 4 === 0);

        // NOUVEAU: Le gibier n'apparaît JAMAIS dans les forêts denses (hasWood)
        const shouldShow = hasAnimals && !hasRoad && !hasBuilding && !hasWood;

        if (shouldShow) {
            if (!sprite) {
                // Chargement paresseux s'il n'est pas encore fait
                if (Object.keys(animalAnimations).length === 0) {
                    loadWildlifeTextures();
                    return;
                }

                const animalTypes = Object.keys(animalAnimations);

                // Choix aléatoire semi-déterministe basé sur l'index
                const animalType = animalTypes[i % animalTypes.length];
                const frames = animalAnimations[animalType];

                if (!frames || frames.length === 0) return;

                sprite = new PIXI.AnimatedSprite(frames);
                sprite.animationSpeed = 0.05; // Animation lente
                sprite.loop = true;

                // Décalage de l'animation pour ne pas que tous bougent en même temps (désynchronisation)
                sprite.gotoAndPlay(i % frames.length);

                // ✅ Ancrage Isométrique
                sprite.anchor.set(0.5, 1.0);

                // Sauvegarde du type d'animal pour la logique de fuite
                (sprite as any).animalType = animalType;

                // ✅ CORRECTION DE L'ÉCHELLE (SCALE)
                // L'animal occupera 40% de la largeur de la tuile
                const frameWidth = frames[0].width;
                const targetSizeRatio = 0.4;
                const tileScale = (TILE_WIDTH * targetSizeRatio) / frameWidth;
                sprite.scale.set(tileScale);

                container.addChild(sprite);
                wildlifeCache.set(i, sprite);
            }

            try {
                if (sprite.destroyed) {
                    wildlifeCache.delete(i);
                    sprite = undefined;
                } else {
                    sprite.visible = true;

                    if (sprite.parent !== container) {
                        container.addChild(sprite);
                    }

                    // ✅ CORRECTION DU PLACEMENT ISOMÉTRIQUE
                    sprite.x = pos.x;
                    // On descend de la moitié d'une tuile pour simuler le sol 3D isométrique
                    // J'ajoute +10 pour poser leurs pattes parfaitement au sol
                    sprite.y = pos.y + (TILE_HEIGHT / 2) + SURFACE_Y_OFFSET + 10;

                    // Z-Index isométrique classique + un léger offset
                    const x = i % GRID_SIZE;
                    const y = Math.floor(i / GRID_SIZE);
                    sprite.zIndex = x + y + 0.6; // Léger offset +0.6 pour passer potentiellement juste après l'arbre
                }
            } catch (e) {
                console.error(`🚨 [WildlifeRenderer] Error drawing wildlife ${i}:`, e);
                wildlifeCache.delete(i);
                sprite = undefined;
            }
        } else if (sprite) {
            // S'il existe un sprite et qu'il ne doit plus être affiché
            // C'est qu'on vient de construire une route/un bâtiment => FUITE !
            WildlifeRenderer.removeWildlifeAt(i);
        }
    }

    static clearAll(container?: PIXI.Container | null) {
        wildlifeCache.forEach((sprite) => {
            try {
                if (!sprite.destroyed) {
                    if (container && sprite.parent === container) {
                        container.removeChild(sprite);
                    } else if (sprite.parent) {
                        sprite.parent.removeChild(sprite);
                    }
                    sprite.stop();
                    sprite.destroy();
                }
            } catch (e) {
                // Ignore silent destruction errors
            }
        });
        wildlifeCache.clear();
    }
}
