import * as PIXI from 'pixi.js';
import { MapEngine } from '../engine/MapEngine';
import { GRID_SIZE, TILE_WIDTH, TILE_HEIGHT, SURFACE_Y_OFFSET } from '../engine/config';
import { gridToScreen } from '../engine/isometric';
import { RoadAssets } from '../engine/RoadAssets';

// Instance pour le rendu des routes (Sprite Caching)

export class RoadRenderer {
    private container: PIXI.Container;
    private roadCache: Map<number, PIXI.Sprite>; // Cache par index de tuile

    constructor() {
        this.container = new PIXI.Container();
        this.container.label = "RoadRenderer";
        this.container.zIndex = 10;
        this.container.sortableChildren = true;
        this.roadCache = new Map();
    }

    getContainer(): PIXI.Container {
        return this.container;
    }

    private hasLoggedError: boolean = false; // ✅ Le flag anti-spam

    render(engine: MapEngine) {
        if (this.container.destroyed) return;

        try {
            // On parcourt tout le calque de routes
            for (let i = 0; i < engine.config.totalCells; i++) {
                const roadData = engine.roadLayer[i];

                if (roadData) {
                    // 1. Récupération / Création du Sprite
                    let sprite = this.roadCache.get(i);

                    // Texture correcte selon les connexions
                    const texture = RoadAssets.getTexture(roadData.type, roadData.connections);

                    if (!texture) {
                        // Si la texture est invalide, on skip ce tile sans crasher
                        continue;
                    }

                    if (!sprite) {
                        sprite = new PIXI.Sprite(texture);
                        sprite.anchor.set(0.5, 0.5); // Centre parfait

                        // Position ISO
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);
                        const pos = gridToScreen(x, y);

                        // Ajustement Hauteur (Surface)
                        if (isNaN(pos.y)) {
                            console.error(`🚨 [RoadRenderer] NaN detected for tile ${i} (x:${x}, y:${y})`);
                            continue;
                        }

                        sprite.x = pos.x;
                        sprite.y = pos.y + (SURFACE_Y_OFFSET); // ✅ Application de l'offset 3D

                        this.container.addChild(sprite);
                        this.roadCache.set(i, sprite);
                    }

                    // Mise à jour continue (au cas où la texture change : connexion mise à jour)
                    if (sprite.texture !== texture) {
                        sprite.texture = texture;
                    }

                    // Ré-attachement si nécessaire (Clean-Redraw)
                    if (sprite.parent !== this.container) {
                        this.container.addChild(sprite);
                    }

                    sprite.visible = true;
                    sprite.zIndex = i; // Tri basique par index (suffisant pour sol plat)

                } else {
                    // Pas de route ici, supprimer le sprite s'il existe
                    const sprite = this.roadCache.get(i);
                    if (sprite) {
                        if (sprite.parent) sprite.parent.removeChild(sprite);
                        sprite.destroy();
                        this.roadCache.delete(i);
                    }
                }
            }
        } catch (error) {
            // ✅ On ne logue l'erreur qu'une seule fois !
            if (!this.hasLoggedError) {
                console.error("🚨 [RoadRenderer] CRASH ISOLÉ pendant le rendu :", error);
                this.hasLoggedError = true;
            }
            // ✅ Nettoyage des artefacts corrompus (sécurité visuelle)
            // this.container.removeChildren(); // ⚠️ Trop agressif, on garde ce qui a marché
        }
    }

    destroy() {
        this.roadCache.forEach(s => s.destroy());
        this.roadCache.clear();
        this.container.destroy({ children: true });
    }

    // Méthodes legacy (vides pour compatibilité)
    static drawTile() { }
    static removeTile() { }
    static clearCache() { }
}

