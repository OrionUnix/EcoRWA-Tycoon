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

        // Validation du cache : Si le container est détruit ou n'est plus dans le bon parent
        if (container && (container.destroyed || container.parent !== parentContainer)) {
            // On le retire du cache et on le laisse être recréé
            if (!container.destroyed && container.parent) {
                container.parent.removeChild(container);
            }
            container = undefined;
            buildingCache.delete(i);
        }

        // Création si inexistant
        if (!container) {
            container = new PIXI.Container();

            // 1. Graphics pour le bâtiment
            const gfx = new PIXI.Graphics();
            container.addChild(gfx);

            // 2. Text pour l'emote (caché par défaut)
            const text = new PIXI.Text({ text: '', style: { fontSize: 24 } });
            text.anchor.set(0.5, 1);
            text.y = -40; // Au dessus du toit
            container.addChild(text);

            parentContainer.addChild(container);
            buildingCache.set(i, container);
        }

        container.visible = true;
        container.x = pos.x;
        container.y = pos.y;

        // Z-INDEX
        container.zIndex = x + y + 1;

        // --- DESSIN DU BÂTIMENT ---
        // Sécurité : On vérifie que children[0] est bien un Graphics
        let graphics = container.children[0] as PIXI.Graphics;
        if (!graphics || graphics.destroyed) {
            // Cas rare mais possible : on recrée tout le container
            container.destroy({ children: true });
            buildingCache.delete(i);
            // On rappelle la fonction récursivement (une seule fois)
            return this.drawTile(parentContainer, building, x, y, pos, isHigh, isLow);
        }

        // --- DESSIN DU BÂTIMENT ---

        // 1. Check si un Sprite est dispo via BuildingAssets
        // Import dynamique ou statique ? BuildingAssets est une classe statique.
        // On suppose que l'import est fait en haut (je vais l'ajouter)

        let drawn = false;

        if (!isLow && building.state === 'ACTIVE') {
            // Tenter de récupérer la texture
            // Note: On a besoin d'importer BuildingAssets.
            // Pour éviter les cycles, on utilise une méthode un peu "sale" ou on déplace le cache ?
            // On va assumer que BuildingAssets est accessible grossièrement ou on l'importe.

            // Hack temporaire si l'import pose souci : window
            // Mais faisons le proprement : import { BuildingAssets } from './BuildingAssets';
            // Je vais ajouter l'import dans une autre étape.

            // Pour l'instant, je mets le placeholder du code de dessin Sprite
            // Si texture on remplace le graphics par un sprite ?
            // Non, le container contient [Graphics, Text].

            // Gestion : Si Sprite, on cache le graphics et on ajoute un Sprite ?
            // Structure actuelle du container : [Graphics, Text]
            // Si je veux mettre un sprite, je le mets en enfant 0 à la place du Graphics ou dedans ?
            // Mieux : [Graphics (Background/Debug), Sprite, Text]

            // Vérifions si on a un sprite enfant
            let sprite = container.children.find(c => c instanceof PIXI.Sprite) as PIXI.Sprite;

            // Récup texture
            // const texture = BuildingAssets.getTexture(building.type, building.level, building.variant);
            // On peut pas appeler BuildingAssets ici si pas importé.
            // Je vais supposer que je vais ajouter l'import.
        }



        // --- GESTION DES EMOTES ---
        const h = isLow ? 10 : 25; // Re-définition nécessaire pour l'emote
        const emoteText = container.children[1] as PIXI.Text;
        const emote = this.getEmote(building);

        if (emote && !isLow) {
            emoteText.text = emote;
            emoteText.visible = true;
            // Animation simple (flottement)
            const bounce = Math.sin(Date.now() / 200) * 5;
            emoteText.y = -h - 15 + bounce;
        } else {
            emoteText.visible = false;
        }
    }

    static getEmote(building: BuildingData): string | null {
        // Priorité d'affichage
        if (building.state === 'CONSTRUCTION') return '🏗️';
        if (building.state === 'ABANDONED') return '🏚️';

        const flags = building.statusFlags;
        // Import BuildingStatus via require or assume usage (bit diff here without import)
        // On utilise les valeurs raw ou on importe (mieux d'importer mais types.ts est dispo)
        // 1=WATER, 2=POWER, 4=FOOD, 8=JOBS, 16=UNHAPPY

        if (flags & 1) return '💧'; // No Water
        if (flags & 2) return '⚡'; // No Power
        if (flags & 4) return '🍞'; // No Food
        if (flags & 8) return '🛠️'; // No Job
        if (flags & 16) return '😡'; // Unhappy / Pollution

        return null;
    }

    static clearAll(parentContainer: PIXI.Container) {
        buildingCache.forEach(c => {
            parentContainer.removeChild(c);
            c.destroy({ children: true });
        });
        buildingCache.clear();
    }
}