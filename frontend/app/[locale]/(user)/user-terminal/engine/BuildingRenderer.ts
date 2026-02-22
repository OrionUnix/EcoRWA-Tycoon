import * as PIXI from 'pixi.js';
import { BuildingData, BUILDING_SPECS } from '../engine/types';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { BuildingAssets } from './BuildingAssets';
import { FXRenderer } from './FXRenderer';

export const RESIDENTIAL_SCALE = 0.5; // Modifiable pour ajuster la taille
const SURFACE_Y_OFFSET = 0; // Ajustement fin Y pour coller au sol

// ═══════════════════════════════════════════════════════
// BuildingRenderer — Rendu des bâtiments (Engine)
// Priorité 1: Sprite depuis l'atlas TexturePacker (PIXI.Sprite)
// Fallback:   Cube coloré isométrique (PIXI.Graphics + Emote)
// ═══════════════════════════════════════════════════════

const buildingCache = new Map<number, PIXI.Container>();

export class BuildingRenderer {

    static drawTile(
        parentContainer: PIXI.Container,
        building: BuildingData,
        x: number,
        y: number,
        pos: { x: number, y: number },
        isHigh: boolean,
        isLow: boolean
    ): void {
        const i = y * GRID_SIZE + x;
        let container = buildingCache.get(i);

        // Validation du cache
        if (container && (container.destroyed || container.parent !== parentContainer)) {
            if (!container.destroyed && container.parent) {
                container.parent.removeChild(container);
            }
            container = undefined;
            buildingCache.delete(i);
        }

        // Création si inexistant
        if (!container) {
            container = new PIXI.Container();
            parentContainer.addChild(container);
            buildingCache.set(i, container);
        }

        container.visible = true;
        container.x = pos.x;
        container.y = pos.y;

        // Formule de profondeur isométrique stricte
        container.zIndex = x + y + 0.5;

        const lvl = building.level || 0;
        const isConstState = building.state === 'CONSTRUCTION' || lvl === 0;

        // ═══════════════════════════════════════
        // FX: Particules de construction (Fumée)
        // ═══════════════════════════════════════
        if (isConstState) {
            if (!(building as any)._dustPlayed) {
                (building as any)._dustPlayed = true;

                // Essayer de trouver la fxContainer s'il existe via la racine du monde (terrainContainerRef)
                const targetFxContainer = parentContainer.parent?.getChildByLabel("fxContainer") as PIXI.Container || parentContainer;

                FXRenderer.playConstructionDust(
                    targetFxContainer,
                    pos.x,
                    pos.y + (TILE_HEIGHT / 2) + SURFACE_Y_OFFSET, // Centre de la base isométrique
                    container.zIndex + 0.1 // Juste au dessus du mur/sol
                );
            }
        }

        // ═══════════════════════════════════════
        // Tenter le rendu sprite depuis l'atlas ou Custom
        // ═══════════════════════════════════════
        const texture = BuildingAssets.getTexture(
            building.type as any,
            lvl || 1,
            building.variant || 0,
            isConstState
        );

        if (texture) {
            // Nettoyer les anciens enfants (Graphics/Text) et remplacer par le sprite
            let sprite = container.children.find(c => c instanceof PIXI.Sprite) as PIXI.Sprite | undefined;

            if (!sprite) {
                // Premier rendu avec atlas — supprimer les anciens Graphics/Text
                while (container.children.length > 0) {
                    const child = container.children[0];
                    container.removeChild(child);
                    if (!child.destroyed) child.destroy();
                }

                sprite = new PIXI.Sprite(texture);
                // ✅ ANCRAGE BASE-CENTRE — aligne la base du sprite avec le centre de la tuile iso
                sprite.anchor.set(0.5, 1.0);

                // Mission 2: Éviter que les zones transparentes bloquent les clics
                sprite.eventMode = 'static';

                container.addChild(sprite);

                // Recreate emote text above sprite
                const text = new PIXI.Text({ text: '', style: { fontSize: 24, fontWeight: 'bold', stroke: { color: 0x000000, width: 2 } } });
                text.anchor.set(0.5, 1);
                container.addChild(text);
            } else {
                // Mettre à jour la texture si le bâtiment a évolué
                if (sprite.texture !== texture) {
                    sprite.texture = texture;
                }
            }

            // Positionnement : le sprite est ancré à (0.5, 1.0)
            // Le container est déjà positionné au centre de la tuile (pos.x, pos.y)
            const isCustomIso = (texture as any).isCustomIso === true;
            let currentScale = 1.0;

            if (isCustomIso) {
                // ✅ MODE CUSTOM 128x128
                sprite.x = 0;
                sprite.y = TILE_HEIGHT / 2 + SURFACE_Y_OFFSET;
                currentScale = RESIDENTIAL_SCALE;
                sprite.scale.set(currentScale);
            } else {
                // ✅ MODE EXISTANT (ATLAS FALLBACK)
                sprite.x = 0;
                sprite.y = TILE_HEIGHT / 2;
                currentScale = TILE_WIDTH / texture.width;
                sprite.scale.set(currentScale);
            }

            // HitArea isométrique
            const hw = (TILE_WIDTH / 2) / currentScale;
            const hh = (TILE_HEIGHT / 2) / currentScale;
            // Centre local de la tuile iso par rapport au point d'ancrage du sprite
            const cy = -(sprite.y) / currentScale;

            sprite.hitArea = new PIXI.Polygon([
                new PIXI.Point(0, cy - hh),
                new PIXI.Point(hw, cy),
                new PIXI.Point(0, cy + hh),
                new PIXI.Point(-hw, cy)
            ]);

            // Gestion de l'emote (toujours au dessus du sprite)
            const emoteText = container.children.find(c => c instanceof PIXI.Text) as PIXI.Text | undefined;
            if (emoteText) {
                const emote = this.getEmote(building);
                if (emote && !isLow) {
                    emoteText.text = emote;
                    emoteText.visible = true;
                    const bounce = Math.sin(Date.now() / 200) * 5;
                    emoteText.x = 0;
                    emoteText.y = -(TILE_HEIGHT + 30) + bounce; // Emote juste au-dessus du diamant iso
                } else {
                    emoteText.visible = false;
                }
            }

            return; // ✅ Sprite rendu, pas besoin du fallback
        }

        // ═══════════════════════════════════════
        // FALLBACK: Cube coloré isométrique 3D
        // (si atlas manquant ou texture pas trouvée)
        // ═══════════════════════════════════════

        // S'assurer qu'on a un Graphics + Text enfants
        let graphics = container.children.find(c => c instanceof PIXI.Graphics) as PIXI.Graphics | undefined;
        let emoteText = container.children.find(c => c instanceof PIXI.Text) as PIXI.Text | undefined;

        if (!graphics) {
            // Nettoyer tout et recréer
            while (container.children.length > 0) {
                const child = container.children[0];
                container.removeChild(child);
                if (!child.destroyed) child.destroy();
            }

            graphics = new PIXI.Graphics();
            container.addChild(graphics);

            emoteText = new PIXI.Text({ text: '', style: { fontSize: 24, fontWeight: 'bold', stroke: { color: 0x000000, width: 2 } } });
            emoteText.anchor.set(0.5, 1);
            container.addChild(emoteText);
        }

        graphics.clear();

        // Hauteur et couleur selon le type et level
        const level = building.level || 0;
        const isConstruction = building.state === 'CONSTRUCTION' || level === 0;

        let height = 10;
        if (level === 1) height = 40;
        if (level === 2) height = 80;
        if (level === 3) height = 150;

        let baseColor = 0x9E9E9E;
        if (!isConstruction) {
            switch (building.type) {
                case 'RESIDENTIAL': baseColor = 0xFF00FF; break;
                case 'COMMERCIAL': baseColor = 0x2196F3; break;
                case 'INDUSTRIAL': baseColor = 0xFF9800; break;
                case 'POWER_PLANT': baseColor = 0xFF5722; break;
                case 'WATER_PUMP': baseColor = 0x03A9F4; break;
                case 'PARK': baseColor = 0x8BC34A; break;
                default: baseColor = 0x607D8B;
            }
        }

        const colorTop = baseColor;
        const colorLeft = this.darkenColor(baseColor, 0.8);
        const colorRight = this.darkenColor(baseColor, 0.6);

        const halfW = TILE_WIDTH / 2;
        const halfH = TILE_HEIGHT / 2;
        const margin = 4;
        const w = halfW - margin;
        const h = halfH - (margin / 2);

        // Face du HAUT
        graphics.beginPath();
        graphics.moveTo(0, -h - height);
        graphics.lineTo(w, -height);
        graphics.lineTo(0, h - height);
        graphics.lineTo(-w, -height);
        graphics.closePath();
        graphics.fill({ color: colorTop });
        graphics.stroke({ width: 2, color: 0x1B5E20, alpha: 0.8 });

        // Face GAUCHE
        graphics.beginPath();
        graphics.moveTo(-w, -height);
        graphics.lineTo(0, h - height);
        graphics.lineTo(0, h);
        graphics.lineTo(-w, 0);
        graphics.closePath();
        graphics.fill({ color: colorLeft });

        // Face DROITE
        graphics.beginPath();
        graphics.moveTo(0, h - height);
        graphics.lineTo(w, -height);
        graphics.lineTo(w, 0);
        graphics.lineTo(0, h);
        graphics.closePath();
        graphics.fill({ color: colorRight });

        // Emote
        if (emoteText) {
            const emote = this.getEmote(building);
            if (emote && !isLow) {
                emoteText.text = emote;
                emoteText.visible = true;
                const bounce = Math.sin(Date.now() / 200) * 5;
                emoteText.y = -height - 40 + bounce;
            } else {
                emoteText.visible = false;
            }
        }
    }

    private static darkenColor(color: number, factor: number): number {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return ((r * factor) << 16) | ((g * factor) << 8) | (b * factor);
    }

    static getEmote(building: BuildingData): string | null {
        if (building.state === 'CONSTRUCTION') return '🏗️';
        if (building.state === 'ABANDONED') return '🏚️';

        const flags = building.statusFlags;
        if (flags & 1) return '💧';
        if (flags & 2) return '⚡';
        if (flags & 4) return '🍞';
        if (flags & 8) return '🛠️';
        if (flags & 16) return '😡';

        return null;
    }

    static clearCache() {
        buildingCache.forEach(c => {
            if (c.parent) {
                c.parent.removeChild(c);
            }
            if (!c.destroyed) {
                c.destroy({ children: true });
            }
        });
        buildingCache.clear();
    }

    /**
     * Supprime visuellement le sprite du bâtiment
     */
    static removeBuilding(index: number) {
        const container = buildingCache.get(index);
        if (container) {
            if (container.parent) {
                container.parent.removeChild(container);
            }
            if (!container.destroyed) {
                container.destroy({ children: true });
            }
            buildingCache.delete(index);
        }
    }

    /**
     * Joue l'effet de destruction (nuage de poussière)
     */
    static playDemolitionFX(index: number, map: any) {
        // Obtenir le premier conteneur parent (du building s'il existe encore dans le cache, sinon on calcule la position absolue)
        const cachedContainer = buildingCache.get(index);

        let targetX = 0;
        let targetY = 0;
        let parentContainer: PIXI.Container | null = null;
        let zIndex = 0;

        if (cachedContainer && cachedContainer.parent) {
            targetX = cachedContainer.x;
            targetY = cachedContainer.y + (TILE_HEIGHT / 2) + SURFACE_Y_OFFSET;
            parentContainer = cachedContainer.parent;
            zIndex = cachedContainer.zIndex + 0.1;
        } else {
            // Calcul fallback si le conteneur a déjà été détruit ou n'existait pas en cache
            const gridX = index % GRID_SIZE;
            const gridY = Math.floor(index / GRID_SIZE);

            // Calculer la projection isométrique manuellement si pas de container
            const halfW = TILE_WIDTH / 2;
            const halfH = TILE_HEIGHT / 2;

            targetX = (gridX - gridY) * halfW;
            targetY = (gridX + gridY) * halfH + halfH + SURFACE_Y_OFFSET;
            zIndex = gridX + gridY + 0.5;

            // On a besoin du conteneur parent du renderer pour ajouter le FX si on n'a pas le conteneur du batiment
            // Hack : on va chercher un conteneur d'un autre batiment pour trouver le parent `world`
            // Si on ne trouve rien, on abandonne
            for (const [_, container] of buildingCache.entries()) {
                if (container.parent) {
                    parentContainer = container.parent;
                    break;
                }
            }
        }

        if (parentContainer) {
            // Essayer de trouver la fxContainer s'il existe via la racine du monde (terrainContainerRef)
            const targetFxContainer = parentContainer.parent?.getChildByLabel("fxContainer") as PIXI.Container || parentContainer;

            FXRenderer.playConstructionDust(
                targetFxContainer,
                targetX,
                targetY,
                zIndex
            );
        }
    }
}