import { MapEngine } from './MapEngine';
import { BuildingType } from './types';
import { GRID_SIZE } from './config';
import { ChunkManager } from './ChunkManager';
import { EconomySystem } from './systems/EconomySystem';

/**
 * RWABuildingSpawner — Bridge React↔GameEngine
 *
 * Écoute 'place_building_on_map' dispatché par RWAInventory.
 * Deux améliorations Polish :
 *   1. Placement INTELLIGENT : tuile adjacente à une route (pas n'importe où)
 *   2. Texture SPÉCIFIQUE : le champ rwaTexture passe dans BuildingData
 *      → BuildingRenderer le charge directement via PIXI.Assets
 */

// Mapping rwaId → BuildingType
const RWA_BUILDING_TYPE_MAP: Record<number, BuildingType> = {
    1: BuildingType.RESIDENTIAL, // Loft Industriel
    2: BuildingType.COMMERCIAL,  // Bistrot Parisien
    3: BuildingType.RESIDENTIAL, // Eco-Tower (MIXED non disponible)
};

// Mapping rwaId → chemin de texture isométrique RWA
const RWA_TEXTURE_MAP: Record<number, string> = {
    1: '/assets/isometric/Spritesheet/Buildings/RWA/RWA_loft.png',
    2: '/assets/isometric/Spritesheet/Buildings/RWA/RWA_bistro.png',
    3: '/assets/isometric/Spritesheet/Buildings/RWA/RWA_ecotower.png',
};

// Suivi anti-doublon (persistant en mémoire, complété par le localStorage côté React)
const placedRWAIds = new Set<number>();

export class RWABuildingSpawner {

    private static engine: MapEngine | null = null;
    private static purchaseListener: ((e: Event) => void) | null = null;
    private static placeListener: ((e: Event) => void) | null = null;

    /** Initialise et attache les listeners. Appelé dans GameEngine constructor. */
    static initialize(engine: MapEngine): void {
        this.destroy(); // Nettoyage hot-reload
        this.engine = engine;

        // Listener 1 : 'rwa_purchased' — pas d'auto-spawn, le joueur doit placer manuellement
        this.purchaseListener = (_e: Event) => { /* no-op */ };
        window.addEventListener('rwa_purchased', this.purchaseListener);

        // Listener 2 : 'place_building_on_map' — placement manuel depuis RWAInventory
        this.placeListener = (e: Event) => {
            const { rwaId, texturePath, imageName } = (e as CustomEvent).detail ?? {};
            if (!rwaId) return;
            // texturePath envoyé par React prend priorité sur le RWA_TEXTURE_MAP interne
            this.handleManualPlacement(rwaId, texturePath, imageName);
        };
        window.addEventListener('place_building_on_map', this.placeListener);

        console.log('🏗️ [RWABuildingSpawner] Initialisé (placement road-adjacent activé)');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PLACEMENT
    // ──────────────────────────────────────────────────────────────────────────

    private static handleManualPlacement(rwaId: number, texturePath?: string, imageName?: string): void {
        if (!this.engine) return;

        if (placedRWAIds.has(rwaId)) {
            console.log(`[RWABuildingSpawner] RWA #${rwaId} déjà sur la carte.`);
            return;
        }

        const buildingType = RWA_BUILDING_TYPE_MAP[rwaId];
        if (!buildingType) return;

        // ✅ POLISH 2 — Trouver une tuile adjacente à une route
        const targetIdx = this.findTileAdjacentToRoad();

        // Si aucune route trouvée, avertir React via un event Bob
        if (targetIdx === -1) {
            const fallback = this.findAvailableTileFallback();
            if (fallback === -1) {
                console.warn('[RWABuildingSpawner] Aucune tuile disponible.');
                window.dispatchEvent(new CustomEvent('show_bob_warning', {
                    detail: {
                        messageKey: 'error_road' // Clé i18n de bob
                    }
                }));
                return;
            }
        }

        const finalIdx = targetIdx !== -1 ? targetIdx : this.findAvailableTileFallback();
        if (finalIdx === -1) return;

        const x = finalIdx % GRID_SIZE;
        const y = Math.floor(finalIdx / GRID_SIZE);

        // ✅ POLISH 1 — Priorité : texturePath React > dictionnaire interne > imageName
        const resolvedTexture = texturePath
            ?? RWA_TEXTURE_MAP[rwaId]
            ?? (imageName ? `/assets/isometric/Spritesheet/Buildings/RWA/${imageName}.png` : undefined);

        // Injection dans buildingLayer avec le champ rwaTexture
        this.engine.buildingLayer[finalIdx] = {
            type: buildingType,
            x,
            y,
            variant: 0,
            level: 3,
            state: 'ACTIVE',
            constructionTimer: 0,
            pollution: 0,
            happiness: 100,
            statusFlags: 0,
            stability: 100,
            jobsAssigned: 0,
            rwaTexture: resolvedTexture, // ← BuildingRenderer charge ce PNG directement
        };

        this.engine.revision++;

        // Active le bonus x2
        EconomySystem.activateRWABonus();
        placedRWAIds.add(rwaId);

        console.log(`✅ [RWABuildingSpawner] RWA #${rwaId} placé en [${x}, ${y}] — texture: ${texturePath} — Bonus x2 actif`);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PLACEMENT INTELLIGENT : TUILE ADJACENTE À UNE ROUTE
    // Scan la carte, trouve une route, vérifie ses 4 voisins (N/S/E/W)
    // ──────────────────────────────────────────────────────────────────────────

    private static findTileAdjacentToRoad(): number {
        if (!this.engine) return -1;

        const OFFSETS = [
            { dx: 0, dy: -1 }, // Nord
            { dx: 0, dy: 1 },  // Sud
            { dx: -1, dy: 0 }, // Ouest
            { dx: 1, dy: 0 },  // Est
        ];

        // Scan depuis le centre de la map vers les bords pour prioriser les zones développées
        const center = Math.floor(GRID_SIZE / 2);

        for (let radius = 1; radius < GRID_SIZE / 2; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    // Périmètre du rayon uniquement (évite de re-scanner l'intérieur)
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                    const rx = center + dx;
                    const ry = center + dy;
                    if (rx < 0 || ry < 0 || rx >= GRID_SIZE || ry >= GRID_SIZE) continue;

                    const roadIdx = ry * GRID_SIZE + rx;

                    // Si c'est une route, chercher un voisin libre
                    if (!this.engine.roadLayer[roadIdx]) continue;

                    for (const { dx: nx, dy: ny } of OFFSETS) {
                        const vx = rx + nx;
                        const vy = ry + ny;
                        if (vx < 0 || vy < 0 || vx >= GRID_SIZE || vy >= GRID_SIZE) continue;

                        const vIdx = vy * GRID_SIZE + vx;
                        if (this.isTileAvailable(vx, vy, vIdx)) return vIdx;
                    }
                }
            }
        }

        return -1; // Aucune tuile road-adjacent disponible
    }

    /** Détermine si une tuile peut accueillir un bâtiment RWA */
    private static isTileAvailable(x: number, y: number, idx: number): boolean {
        if (!this.engine) return false;
        const isUnlocked = ChunkManager.isTileUnlocked(x, y);
        const hasBuilding = !!this.engine.buildingLayer[idx];
        const hasRoad = !!this.engine.roadLayer[idx];
        const biome = this.engine.biomes[idx];
        const isBuildable = biome >= 2 && biome <= 5; // Pas océan, pas montagne/neige

        return isUnlocked && !hasBuilding && !hasRoad && isBuildable;
    }

    /** Fallback spirale si aucune route n'est posée sur la map */
    private static findAvailableTileFallback(): number {
        if (!this.engine) return -1;
        const center = Math.floor(GRID_SIZE / 2);
        for (let radius = 2; radius < GRID_SIZE / 2; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                    const nx = center + dx;
                    const ny = center + dy;
                    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue;
                    const idx = ny * GRID_SIZE + nx;
                    if (this.isTileAvailable(nx, ny, idx)) return idx;
                }
            }
        }
        return -1;
    }

    /** Vérifie si un RWA donné est déjà placé sur la carte */
    static isPlaced(rwaId: number): boolean {
        return placedRWAIds.has(rwaId);
    }

    /** Cleanup listeners (hot-reload Next.js) */
    static destroy(): void {
        if (this.purchaseListener) {
            window.removeEventListener('rwa_purchased', this.purchaseListener);
            this.purchaseListener = null;
        }
        if (this.placeListener) {
            window.removeEventListener('place_building_on_map', this.placeListener);
            this.placeListener = null;
        }
        this.engine = null;
    }
}
