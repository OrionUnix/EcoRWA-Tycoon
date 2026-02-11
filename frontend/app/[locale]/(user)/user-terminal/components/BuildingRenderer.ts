import * as PIXI from 'pixi.js';
import { BuildingData, BUILDING_SPECS } from '../engine/types';
import { TILE_WIDTH, TILE_HEIGHT, GRID_SIZE } from '../engine/config';

const buildingCache = new Map<number, PIXI.Graphics>();

export class BuildingRenderer {
    /**
     * Dessine un bâtiment sous forme de cube isométrique
     * @param container Conteneur PIXI où ajouter le graphique
     * @param building Données du bâtiment
     * @param x Coordonnée X dans la grille
     * @param y Coordonnée Y dans la grille
     * @param pos Position écran (depuis gridToScreen)
     * @param isHigh Flag d'élévation haute (unused for now)
     * @param isLow Flag d'élévation basse (unused for now)
     */
    static drawTile(
        container: PIXI.Container,
        building: BuildingData,
        x: number,
        y: number,
        pos: { x: number; y: number },
        isHigh: boolean,
        isLow: boolean
    ) {
        const index = y * GRID_SIZE + x;
        let g = buildingCache.get(index);

        // Créer le graphique s'il n'existe pas
        if (!g) {
            g = new PIXI.Graphics();
            container.addChild(g);
            buildingCache.set(index, g);
        }

        // Nettoyer et redessiner
        g.clear();

        const specs = BUILDING_SPECS[building.type];
        const color = specs.color;
        const w = TILE_WIDTH;
        const h = TILE_HEIGHT;

        // Hauteur du cube (isométrique)
        const cubeHeight = h * 1.5;

        // ===== FACE SUPÉRIEURE (DIAMANT) =====
        g.beginFill(color, 0.9);
        g.moveTo(pos.x, pos.y - cubeHeight);           // Haut
        g.lineTo(pos.x + w / 2, pos.y - cubeHeight + h / 2); // Droite
        g.lineTo(pos.x, pos.y - cubeHeight + h);        // Bas
        g.lineTo(pos.x - w / 2, pos.y - cubeHeight + h / 2); // Gauche
        g.closePath();
        g.endFill();

        // ===== FACE GAUCHE =====
        g.beginFill(color, 0.6);
        g.moveTo(pos.x - w / 2, pos.y - cubeHeight + h / 2);
        g.lineTo(pos.x, pos.y - cubeHeight + h);
        g.lineTo(pos.x, pos.y);
        g.lineTo(pos.x - w / 2, pos.y - h / 2);
        g.closePath();
        g.endFill();

        // ===== FACE DROITE =====
        g.beginFill(color, 0.7);
        g.moveTo(pos.x + w / 2, pos.y - cubeHeight + h / 2);
        g.lineTo(pos.x, pos.y - cubeHeight + h);
        g.lineTo(pos.x, pos.y);
        g.lineTo(pos.x + w / 2, pos.y - h / 2);
        g.closePath();
        g.endFill();

        // ===== Z-INDEX (CRUCIAL POUR L'ORDRE DE RENDU) =====
        // x + y + 1 garantit que les bâtiments sont au-dessus des routes (x + y + 0.1)
        // et des arbres (x + y + 0.5)
        g.zIndex = x + y + 1;
        g.visible = true;
    }

    /**
     * Supprime un bâtiment du cache et du rendu
     * @param index Index de la tuile
     */
    static removeBuildingAt(index: number) {
        const g = buildingCache.get(index);
        if (g) {
            if (g.parent) g.parent.removeChild(g);
            g.destroy();
            buildingCache.delete(index);
        }
    }

    /**
     * Nettoie tous les bâtiments du cache
     * @param container Conteneur parent
     */
    static clearAll(container: PIXI.Container) {
        buildingCache.forEach((g) => {
            if (g.parent) container.removeChild(g);
            g.destroy();
        });
        buildingCache.clear();
    }
}
