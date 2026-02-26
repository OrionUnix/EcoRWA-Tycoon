import * as PIXI from 'pixi.js';
import { defineQuery } from 'bitecs';
import { globalWorld } from './ecs/world';
import { Position } from './ecs/components/Position';
import { Renderable } from './ecs/components/Renderable';
import { Worker, WorkerType } from './ecs/components/Worker';
import { gridToScreen } from './isometric';
import { TILE_WIDTH, SURFACE_Y_OFFSET } from './config';

// ═══════════════════════════════════════════════════════════════════════════════
// WorkerRenderer — Sprites animés avec découpe de frames d'un spritesheet
//
// Layout des spritesheets :
//   lumberjack_A.png : 3 colonnes × 2 lignes = 6 frames
//   hunter_A.png     : 4 colonnes × 2 lignes = 8 frames (7 utiles)
//   fishingvessel_A.png : 3 colonnes × 2 lignes = 6 frames
//
// On découpe les rectangles frame par frame depuis la texture source.
// PIXI.AnimatedSprite gère l'animation automatiquement.
// ═══════════════════════════════════════════════════════════════════════════════

interface SpritesheetConfig {
    path: string;
    cols: number;
    rows: number;
    frameCount?: number; // Si < cols*rows, on ignore les frames de fin
}

const WORKER_SHEETS: Record<number, SpritesheetConfig> = {
    [WorkerType.LUMBERJACK]: { path: '/assets/isometric/Spritesheet/character/lumberjack_A.png', cols: 3, rows: 2, frameCount: 6 },
    [WorkerType.HUNTER]: { path: '/assets/isometric/Spritesheet/character/hunter_A.png', cols: 4, rows: 2, frameCount: 7 },
    [WorkerType.FISHERMAN]: { path: '/assets/isometric/Spritesheet/character/fishingvessel_A.png', cols: 3, rows: 2, frameCount: 6 },
};

// Vitesse d'animation : frames par seconde
const ANIM_SPEED = 0.12; // 0.1 = lent, 0.2 = rapide

// ── Cache global HMR-safe ─────────────────────────────────────────────────────
const g = globalThis as any;
if (!g._wrkSpriteCache) g._wrkSpriteCache = new Map<number, PIXI.AnimatedSprite>();
if (!g._wrkFrameCache) g._wrkFrameCache = new Map<number, PIXI.Texture[]>();
if (!g._wrkLoadingSet) g._wrkLoadingSet = new Set<number>();

const spriteCache: Map<number, PIXI.AnimatedSprite> = g._wrkSpriteCache;
const frameCache: Map<number, PIXI.Texture[]> = g._wrkFrameCache;
const loadingSet: Set<number> = g._wrkLoadingSet;

// ── Découpe un spritesheet en tableau de textures ─────────────────────────────
async function loadFrames(type: number): Promise<void> {
    if (frameCache.has(type) || loadingSet.has(type)) return;
    const cfg = WORKER_SHEETS[type];
    if (!cfg) { frameCache.set(type, []); return; }

    loadingSet.add(type);
    try {
        const baseTex: PIXI.Texture = await PIXI.Assets.load(cfg.path);
        if (!baseTex || baseTex.destroyed) { frameCache.set(type, []); return; }

        // Pixel-art crisp
        if (baseTex.source) baseTex.source.scaleMode = 'nearest';

        const fw = Math.floor(baseTex.width / cfg.cols);
        const fh = Math.floor(baseTex.height / cfg.rows);
        const total = cfg.frameCount ?? (cfg.cols * cfg.rows);
        const frames: PIXI.Texture[] = [];

        for (let i = 0; i < total; i++) {
            const col = i % cfg.cols;
            const row = Math.floor(i / cfg.cols);
            const rect = new PIXI.Rectangle(col * fw, row * fh, fw, fh);
            frames.push(new PIXI.Texture({ source: baseTex.source, frame: rect }));
        }

        frameCache.set(type, frames);
        console.log(`🎬 [WorkerRenderer] type=${type} — ${frames.length} frames découpées (${fw}×${fh}px)`);
    } catch (e) {
        console.warn(`⚠️ [WorkerRenderer] Impossible de charger le spritesheet type=${type}:`, e);
        frameCache.set(type, []);
    } finally {
        loadingSet.delete(type);
    }
}

// Pré-chargement de tous les types
export async function preloadWorkerSprites(): Promise<void> {
    await Promise.all(Object.keys(WORKER_SHEETS).map(k => loadFrames(Number(k))));
}

export class WorkerRenderer {
    private static query = defineQuery([Worker, Position, Renderable]);

    static render(container: PIXI.Container) {
        if (!globalWorld) return;

        const entities = this.query(globalWorld);
        const currentIds = new Set<number>();

        for (let i = 0; i < entities.length; i++) {
            const eid = entities[i];
            currentIds.add(eid);

            const wx = Position.x[eid];
            const wy = Position.y[eid];
            const type = Worker.type[eid];

            // Textures disponibles ?
            const frames = frameCache.get(type);
            if (!frames) {
                loadFrames(type);   // Lance le chargement async
                continue;           // Rien à afficher cette frame
            }
            if (frames.length === 0) continue; // Échec de chargement

            let sprite = spriteCache.get(eid);

            if (!sprite || sprite.destroyed) {
                // Créer un PIXI.AnimatedSprite avec les frames découpées
                sprite = new PIXI.AnimatedSprite(frames);
                sprite.anchor.set(0.5, 1.0);
                sprite.animationSpeed = ANIM_SPEED;
                sprite.play();

                // ✅ Plus grand : 90% de la largeur d'une tuile
                const targetW = TILE_WIDTH * 0.9;
                sprite.scale.set(targetW / frames[0].width);

                container.addChild(sprite);
                spriteCache.set(eid, sprite);
            }

            // Mise à jour de la position
            const screenPos = gridToScreen(wx, wy);
            sprite.x = screenPos.x;
            sprite.y = screenPos.y + SURFACE_Y_OFFSET;
            sprite.zIndex = Math.floor(wx) + Math.floor(wy) + 0.7;
            sprite.visible = true;
        }

        // Nettoyage des sprites orphelins
        for (const [eid, sprite] of spriteCache.entries()) {
            if (!currentIds.has(eid)) {
                if (!sprite.destroyed) sprite.destroy();
                spriteCache.delete(eid);
            }
        }
    }

    static clear() {
        for (const sprite of spriteCache.values()) {
            if (!sprite.destroyed) sprite.destroy();
        }
        spriteCache.clear();
    }
}
