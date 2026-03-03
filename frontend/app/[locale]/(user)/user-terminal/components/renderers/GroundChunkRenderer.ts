import * as PIXI from 'pixi.js';
import { MapEngine } from '../../engine/MapEngine';
import { ChunkManager } from '../../engine/ChunkManager';
import { BiomeType } from '../../engine/types';
import { getGroundTexture, getBiomeTexture, isGroundTexturesReady } from '../../engine/BiomeAssets';
import {
    GRID_SIZE,
    CHUNK_SIZE,
    CHUNKS_PER_SIDE,
    TILE_WIDTH,
    TILE_HEIGHT,
} from '../../engine/config';

const HALF_W = TILE_WIDTH / 2;   // 32
const HALF_H = TILE_HEIGHT / 2;   // 16

// ═══════════════════════════════════════════════════════════════
// TEXTURE SIZE
// ═══════════════════════════════════════════════════════════════
const TEX_SIZE = 512; // Taille en pixels des PNGs source
export const GROUND_TEX_TILE_REPEAT = 10; // (Avant: 4) Zoom sur la texture pour réduire le bruit (tileScale)

// ═══════════════════════════════════════════════════════════════
// UV MATRIX — projection inverse isométrique
// ═══════════════════════════════════════════════════════════════
// En PixiJS, fill({ texture, matrix }) : la matrice transforme les
// coordonnées locales (pixels écran) en coordonnées texture (pixels).
//
// Projection iso (forward) :
//   sx = (gx - gy) * (TILE_WIDTH/2)
//   sy = (gx + gy) * (TILE_HEIGHT/2)
//
// Inverse :
//   gx = sx/TILE_WIDTH  + sy/TILE_HEIGHT
//   gy = sy/TILE_HEIGHT - sx/TILE_WIDTH
//
// UV texture (en pixels) avec S tuiles par répétition :
//   tex_x = gx * TEX_SIZE / S = sx*(TEX_SIZE/(TILE_WIDTH*S))  + sy*(TEX_SIZE/(TILE_HEIGHT*S))
//   tex_y = gy * TEX_SIZE / S = sx*(-TEX_SIZE/(TILE_WIDTH*S)) + sy*(TEX_SIZE/(TILE_HEIGHT*S))
//
// → matrix.a =  TEX_SIZE / (TILE_WIDTH  * S)
//   matrix.c =  TEX_SIZE / (TILE_HEIGHT * S)
//   matrix.b = -TEX_SIZE / (TILE_WIDTH  * S)
//   matrix.d =  TEX_SIZE / (TILE_HEIGHT * S)
// ═══════════════════════════════════════════════════════════════

function buildUvMatrix(S: number): PIXI.Matrix {
    const kW = TEX_SIZE / (TILE_WIDTH * S);
    const kH = TEX_SIZE / (TILE_HEIGHT * S);
    const m = new PIXI.Matrix();
    m.a = kW;   // sx → tex_x
    m.b = -kW;   // sx → tex_y (négatif)
    m.c = kH;   // sy → tex_x
    m.d = kH;   // sy → tex_y
    m.tx = 0;
    m.ty = 0;
    return m;
}

// ─── Types internes ─────────────────────────────────────────────
function chunkKey(cx: number, cy: number) { return `${cx}_${cy}`; }

interface ChunkEntry {
    container: PIXI.Container;
    gfx: PIXI.Graphics;
    cx: number;
    cy: number;
}

// ═══════════════════════════════════════════════════════════════
// GROUND CHUNK RENDERER v2 — Graphics + Texture Fill
// ═══════════════════════════════════════════════════════════════
// Architecture :
//   terrainContainer
//     └── ground_chunk_0_0  (PIXI.Container)
//           └── PIXI.Graphics  ← 1 seul objet pour CHUNK_SIZE² losanges
//     └── ground_chunk_1_0  ...
//
// Avantages vs 1024 Sprites :
//   ✅ Pas d'artefacts de scaling  (le losange est tracé exact)
//   ✅ Texture seamless            (matrice UV globale)
//   ✅ Beaucoup moins d'objets GPU
//   ✅ Build-once + culling visible
// ═══════════════════════════════════════════════════════════════

export class GroundChunkRenderer {
    private chunkPool = new Map<string, ChunkEntry>();
    private parent: PIXI.Container | null = null;
    private lastRevision = -1;
    private built = false;

    // ── API publique ─────────────────────────────────────────────

    update(
        engine: MapEngine,
        container: PIXI.Container,
        viewBounds: PIXI.Rectangle,
    ): void {
        if (!engine.biomes) return;
        if (this.parent !== container) this.parent = container;

        if (!this.built || engine.revision !== this.lastRevision) {
            this._buildAll(engine, container);
            this.lastRevision = engine.revision;
        }

        this._cullChunks(viewBounds);
    }

    /** Mise à jour de teinte après unlock d'une parcelle — O(1) */
    refreshChunkTint(cx: number, cy: number): void {
        const entry = this.chunkPool.get(chunkKey(cx, cy));
        if (!entry) return;
        const unlocked = ChunkManager.isTileUnlocked(cx * CHUNK_SIZE, cy * CHUNK_SIZE);
        entry.container.tint = unlocked ? 0xFFFFFF : 0x555555;
    }

    /** Destruction propre — appeler lors d'un reset world */
    destroyAll(): void {
        for (const entry of this.chunkPool.values()) {
            entry.gfx.destroy();
            entry.container.destroy({ children: false });
        }
        this.chunkPool.clear();
        this.built = false;
        this.parent = null;
        this.lastRevision = -1;
    }

    // ── Privé ───────────────────────────────────────────────────

    private _buildAll(engine: MapEngine, container: PIXI.Container): void {
        // Nettoyage des anciens chunks
        for (const entry of this.chunkPool.values()) {
            entry.gfx.destroy();
            if (entry.container.parent) entry.container.parent.removeChild(entry.container);
            entry.container.destroy({ children: false });
        }
        this.chunkPool.clear();

        const usePNG = isGroundTexturesReady();
        const uvMatrix = buildUvMatrix(GROUND_TEX_TILE_REPEAT);

        for (let cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
            for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {
                const entry = this._buildChunk(engine, cx, cy, usePNG, uvMatrix);
                this.chunkPool.set(chunkKey(cx, cy), entry);
                container.addChild(entry.container);
            }
        }
        this.built = true;

        console.log(
            `✅ GroundChunkRenderer v2: ${this.chunkPool.size} chunks ` +
            `(1 Graphics/chunk, ${usePNG ? 'PNG seamless' : 'procédural'})`,
        );
    }

    private _buildChunk(
        engine: MapEngine,
        cx: number, cy: number,
        usePNG: boolean,
        uvMatrix: PIXI.Matrix,
    ): ChunkEntry {
        const chunkContainer = new PIXI.Container();
        chunkContainer.label = `ground_chunk_${cx}_${cy}`;
        chunkContainer.zIndex = 0;

        const gfx = new PIXI.Graphics();
        const startX = cx * CHUNK_SIZE;
        const startY = cy * CHUNK_SIZE;

        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                const gx = startX + lx;
                const gy = startY + ly;
                if (gx >= GRID_SIZE || gy >= GRID_SIZE) continue;

                const i = gy * GRID_SIZE + gx;
                let biome = engine.biomes[i];

                // ✅ LOGIQUE SOUS-BOIS :
                // Si la case contient un arbre (ressource WOOD), on force la texture de terre (BiomeType.FOREST)
                if (engine.resourceMaps.wood && engine.resourceMaps.wood[i] > 0) {
                    biome = BiomeType.FOREST;
                }

                let texture: PIXI.Texture | null = null;
                if (usePNG) texture = getGroundTexture(biome, gx, gy);
                if (!texture || texture.destroyed) texture = getBiomeTexture(biome, gx, gy);

                // Centre de la tuile en coordonnées écran (projection iso)
                const sx = (gx - gy) * HALF_W;   //  = (gx - gy) * TILE_WIDTH/2
                const sy = (gx + gy) * HALF_H;   //  = (gx + gy) * TILE_HEIGHT/2

                // Dessiner le losange
                gfx.poly([
                    sx, sy - HALF_H,  // Sommet haut
                    sx + HALF_W, sy,  // Sommet droite
                    sx, sy + HALF_H,  // Sommet bas
                    sx - HALF_W, sy,  // Sommet gauche
                ]);

                if (texture && !texture.destroyed) {
                    // Remplir avec la texture seamless
                    gfx.fill({ texture, matrix: uvMatrix });
                } else {
                    // Fallback couleur de secours très rapide (pas d'écran noir)
                    if (biome === BiomeType.FOREST) gfx.fill({ color: 0x4E342E }); // Marron
                    else if (biome === BiomeType.DESERT || biome === BiomeType.BEACH) gfx.fill({ color: 0xC2B280 }); // Sable
                    else if (biome === BiomeType.OCEAN || biome === BiomeType.DEEP_OCEAN) gfx.fill({ color: 0x0077BE }); // Eau
                    else gfx.fill({ color: 0x558B2F }); // Herbe (Plains par défaut)
                }
            }
        }

        // Teinte grise pour chunks verrouillés
        const isUnlocked = ChunkManager.isTileUnlocked(startX, startY);
        chunkContainer.tint = isUnlocked ? 0xFFFFFF : 0x555555;

        chunkContainer.addChild(gfx);
        return { container: chunkContainer, gfx, cx, cy };
    }

    /** AABB culling — masque les chunks hors viewport (limites de vue plus solides) */
    private _cullChunks(viewBounds: PIXI.Rectangle): void {
        const margin = TILE_WIDTH * 3; // safe padding

        for (const entry of this.chunkPool.values()) {
            const { cx, cy } = entry;
            const left = (cx * CHUNK_SIZE - (cy * CHUNK_SIZE + CHUNK_SIZE - 1)) * HALF_W;
            const right = ((cx * CHUNK_SIZE + CHUNK_SIZE - 1) - cy * CHUNK_SIZE) * HALF_W;
            const top = (cx * CHUNK_SIZE + cy * CHUNK_SIZE) * HALF_H;
            const bottom = ((cx * CHUNK_SIZE + CHUNK_SIZE - 1) + (cy * CHUNK_SIZE + CHUNK_SIZE - 1)) * HALF_H;

            const bounds = new PIXI.Rectangle(
                left - margin,
                top - margin,
                right - left + margin * 2,
                bottom - top + margin * 2
            );

            entry.container.visible = viewBounds.intersects(bounds);
        }
    }
}

export const groundChunkRenderer = new GroundChunkRenderer();
