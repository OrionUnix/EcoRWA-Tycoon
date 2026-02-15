import * as PIXI from 'pixi.js';
import { BuildingData, BUILDING_SPECS } from '../engine/types'; // On utilise BUILDING_SPECS
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';
import { BuildingAssets } from './BuildingAssets';

// Cache pour les containers (Graphique + Emote)
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
            // 1. Graphics pour le bâtiment 3D
            const gfx = new PIXI.Graphics();
            container.addChild(gfx);

            // 2. Text pour l'emote
            const text = new PIXI.Text({ text: '', style: { fontSize: 24, fontWeight: 'bold', stroke: { color: 0x000000, width: 2 } } });
            text.anchor.set(0.5, 1);
            container.addChild(text);

            parentContainer.addChild(container);
            buildingCache.set(i, container);
        }

        container.visible = true;
        container.x = pos.x;
        container.y = pos.y;
        container.zIndex = x + y + 1; // Au dessus du sol

        // --- DESSIN 3D ISOMÉTRIQUE ---
        const graphics = container.children[0] as PIXI.Graphics;
        graphics.clear(); // Reset dessin précédent

        // 1. Déterminer Hauteur et Couleur
        const level = building.level || 0;
        const isConstruction = building.state === 'CONSTRUCTION' || level === 0;

        // Hauteurs (Level 0 -> 3)
        // 0: Foundations (10px), 1: Small (40px), 2: Medium (80px), 3: Skyscraper (150px)
        let height = 10;
        if (level === 1) height = 40;
        if (level === 2) height = 80;
        if (level === 3) height = 150;

        // Couleurs
        let baseColor = 0x9E9E9E; // Gris par défaut (Construction)

        if (!isConstruction) {
            // Mapping Type -> Couleur
            switch (building.type) {
                case 'RESIDENTIAL': baseColor = 0xFF00FF; break; // Fuchsia (Demande User)
                case 'COMMERCIAL': baseColor = 0x2196F3; break;  // Bleu
                case 'INDUSTRIAL': baseColor = 0xFF9800; break;  // Orange
                case 'POWER_PLANT': baseColor = 0xFF5722; break; // Rouge/Orange
                case 'WATER_PUMP': baseColor = 0x03A9F4; break;  // Cyan
                case 'PARK': baseColor = 0x8BC34A; break;        // Vert clair
                default: baseColor = 0x607D8B; // Gris/Bleu générique
            }
        } else {
            // En construction : Gris foncé
            baseColor = 0x9E9E9E;
        }

        // Calcul des teintes (Ombrage simple)
        // Top: clair, Left: moyen, Right: sombre
        // On assombrit la couleur de base pour les faces
        const colorTop = baseColor;
        const colorLeft = this.darkenColor(baseColor, 0.8);  // -20% lum
        const colorRight = this.darkenColor(baseColor, 0.6); // -40% lum

        // Dimensions
        const halfW = TILE_WIDTH / 2;
        const halfH = TILE_HEIGHT / 2;

        // Marge pour ne pas coller aux bords (Style "SimCity")
        const margin = 4;
        const w = halfW - margin;
        const h = halfH - (margin / 2);

        // Dessin du Prisme 3D
        // Offset Y pour être posé sur le sol (le sol est à pos.y)
        // Le Graphics est local à containe.x/y qui sont déjà pos.x/y
        // Donc (0,0) est le centre de la tuile au sol.

        // Face du HAUT (Losange) - Décalée de -height vers le haut
        graphics.beginPath();
        graphics.moveTo(0, -h - height);         // Top
        graphics.lineTo(w, -height);             // Right
        graphics.lineTo(0, h - height);          // Bottom
        graphics.lineTo(-w, -height);            // Left
        graphics.closePath();
        graphics.fill({ color: colorTop });

        // ✅ CONTRASTE AMÉLIORÉ : Contour plus marqué pour détacher du sol
        graphics.stroke({ width: 2, color: 0x1B5E20, alpha: 0.8 });

        // Face GAUCHE (Rectangle déformé)
        graphics.beginPath();
        graphics.moveTo(-w, -height);            // Top-Left du toit
        graphics.lineTo(0, h - height);          // Bottom-Center du toit
        graphics.lineTo(0, h);                   // Bottom-Center du sol
        graphics.lineTo(-w, 0);                  // Left du sol (milieu gauche) -> Attention c'est un losange
        // Correction géométrique propre :
        // Le sommet Gauche est à (-w, 0) sur le plan (x,y/2).
        // Ici on est en ISO. (0,0) est le centre.
        // Sommet Gauche du sol : (-w, 0)
        // Sommet Bas du sol : (0, h)
        // Sommet Droit du sol : (w, 0)
        // Sommet Haut du sol : (0, -h)

        // Face GAUCHE : Coins (-w, -height), (0, h-height), (0, h), (-w, 0)
        graphics.moveTo(-w, -height);
        graphics.lineTo(0, h - height);
        graphics.lineTo(0, h);
        graphics.lineTo(-w, 0);
        graphics.closePath();
        graphics.fill({ color: colorLeft });

        // Face DROITE : Coins (0, h-height), (w, -height), (w, 0), (0, h)
        graphics.beginPath();
        graphics.moveTo(0, h - height);
        graphics.lineTo(w, -height);
        graphics.lineTo(w, 0);
        graphics.lineTo(0, h);
        graphics.closePath();
        graphics.fill({ color: colorRight });

        // --- GESTION DES EMOTES ---
        const emoteText = container.children[1] as PIXI.Text;
        const emote = this.getEmote(building);

        if (emote && !isLow) {
            emoteText.text = emote;
            emoteText.visible = true;
            // Animation simple (flottement)
            const bounce = Math.sin(Date.now() / 200) * 5;
            emoteText.y = -height - 40 + bounce; // Au dessus du toit (variable selon height)
        } else {
            emoteText.visible = false;
        }
    }

    private static darkenColor(color: number, factor: number): number {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return ((r * factor) << 16) | ((g * factor) << 8) | (b * factor);
    }

    static getEmote(building: BuildingData): string | null {
        // ... (Reste inchangé)
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
}