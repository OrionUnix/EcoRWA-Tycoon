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
    1: '/assets/isometric/Spritesheet/Buildings/RWA/loft.png',
    2: '/assets/isometric/Spritesheet/Buildings/RWA/bistro.png',
    3: '/assets/isometric/Spritesheet/Buildings/RWA/eco.png',
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

        console.log('🏗️ [RWABuildingSpawner] Initialisé (placement manuel actif)');
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PLACEMENT
    // ──────────────────────────────────────────────────────────────────────────

    /** Placement manuel direct sur un noeud précis cliqué par le joueur */
    static placeRWAAtNode(engine: MapEngine, idx: number, rwaId: number, texturePath?: string, imageName?: string): boolean {
        if (placedRWAIds.has(rwaId)) {
            console.log(`[RWABuildingSpawner] RWA #${rwaId} déjà sur la carte.`);
            return false;
        }

        const buildingType = RWA_BUILDING_TYPE_MAP[rwaId];
        if (!buildingType) return false;

        const x = idx % GRID_SIZE;
        const y = Math.floor(idx / GRID_SIZE);

        if (!this.isTileAvailable(engine, x, y, idx)) {
            console.warn('[RWABuildingSpawner] Tuile indisponible pour le RWA.');
            return false;
        }

        // Texture resolving
        const resolvedTexture = texturePath
            ?? RWA_TEXTURE_MAP[rwaId]
            ?? (imageName ? `/assets/isometric/Spritesheet/Buildings/RWA/${imageName}.png` : undefined);

        engine.buildingLayer[idx] = {
            type: buildingType,
            x, y,
            variant: 0, level: 3,
            state: 'ACTIVE',
            constructionTimer: 0,
            pollution: 0,
            happiness: 100,
            statusFlags: 0,
            stability: 100,
            jobsAssigned: 0,
            rwaTexture: resolvedTexture,
        };

        engine.revision++;
        EconomySystem.activateRWABonus();
        placedRWAIds.add(rwaId);

        console.log(`✅ [RWABuildingSpawner] RWA #${rwaId} placé manuellement en [${x}, ${y}]. Bonus x2 actif.`);
        return true;
    }

    /** Détermine si une tuile peut accueillir un bâtiment RWA */
    private static isTileAvailable(engine: MapEngine, x: number, y: number, idx: number): boolean {
        const isUnlocked = ChunkManager.isTileUnlocked(x, y);
        const hasBuilding = !!engine.buildingLayer[idx];
        const hasRoad = !!engine.roadLayer[idx];
        const biome = engine.biomes[idx];
        const isBuildable = biome >= 2 && biome <= 5; // Pas océan, pas montagne/neige
        return isUnlocked && !hasBuilding && !hasRoad && isBuildable;
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
        this.engine = null;
    }
}
