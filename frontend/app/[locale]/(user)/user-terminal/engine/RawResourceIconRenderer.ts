import * as PIXI from 'pixi.js';
import { MapEngine } from './MapEngine';
import { TILE_WIDTH, GRID_SIZE, SURFACE_Y_OFFSET } from './config';

// ═══════════════════════════════════════════════════════════════════════════════
// RawResourceIconRenderer
// Affiche des icônes de ressources souterraines sur les cases de la carte
// (charbon, or, fer, pétrole, argent, pierre, eau souterraine)
//
// Déclenché uniquement quand un DataLayer "ressource" est activé
// pour ne pas polluer la vue normale de la ville.
// ═══════════════════════════════════════════════════════════════════════════════

// Note: le fichier s'appelle "coa.png" (typo dans les assets) et "walter.png" (eau)
const RESOURCE_ICON_PATHS: Record<string, string> = {
    COAL: '/assets/isometric/Spritesheet/resources/raw/coa.png',
    GOLD: '/assets/isometric/Spritesheet/resources/raw/gold.png',
    IRON: '/assets/isometric/Spritesheet/resources/raw/iron.png',
    OIL: '/assets/isometric/Spritesheet/resources/raw/oil.png',
    SILVER: '/assets/isometric/Spritesheet/resources/raw/silver.png',
    STONE: '/assets/isometric/Spritesheet/resources/raw/stone.png',
    WATER: '/assets/isometric/Spritesheet/resources/raw/walter.png',
};

// Seuil minimum pour qu'une ressource soit considérée "présente"
const RESOURCE_THRESHOLD = 0.3;

// ── Cache global HMR-safe ─────────────────────────────────────────────────────
const g = globalThis as any;
if (!g._rawResIconCache) g._rawResIconCache = new Map<string, PIXI.Sprite>();
if (!g._rawResTexCache) g._rawResTexCache = new Map<string, PIXI.Texture | null>();
if (!g._rawResLoading) g._rawResLoading = new Set<string>();

const iconCache: Map<string, PIXI.Sprite> = g._rawResIconCache;
const texCache: Map<string, PIXI.Texture | null> = g._rawResTexCache;
const loadingSet: Set<string> = g._rawResLoading;

// ── Chargement asynchrone ────────────────────────────────────────────────────
async function loadTex(key: string): Promise<void> {
    if (texCache.has(key) || loadingSet.has(key)) return;
    loadingSet.add(key);
    try {
        const tex = await PIXI.Assets.load(RESOURCE_ICON_PATHS[key]);
        if (tex?.source) tex.source.scaleMode = 'nearest';
        texCache.set(key, tex ?? null);
    } catch {
        texCache.set(key, null);
    } finally {
        loadingSet.delete(key);
    }
}

// Pré-charger toutes les textures au démarrage
export async function preloadRawResourceIcons(): Promise<void> {
    await Promise.all(Object.keys(RESOURCE_ICON_PATHS).map(loadTex));
    console.log('⛏️ [RawResourceIconRenderer] Icônes ressources chargées.');
}

// ── Utilitaire isométrique ────────────────────────────────────────────────────
function isoPos(i: number) {
    const tx = i % GRID_SIZE;
    const ty = Math.floor(i / GRID_SIZE);
    return {
        x: (tx - ty) * (TILE_WIDTH / 2),
        y: (tx + ty) * (TILE_WIDTH / 4) + SURFACE_Y_OFFSET,
    };
}

// ── Renderer principal ────────────────────────────────────────────────────────
export class RawResourceIconRenderer {

    /**
     * Affiche toutes les icônes de ressources.
     * @param container  — Le container PIXI dédié (au-dessus du terrain, sous les bâtiments)
     * @param engine     — Le MapEngine
     * @param activeLayer — Ex: 'coal', 'gold', 'all' (null = masquer tout)
     */
    static render(
        container: PIXI.Container,
        engine: MapEngine,
        activeLayer: string | null,
    ) {
        // Si aucun layer actif → masquer tous les sprites
        if (!activeLayer) {
            for (const s of iconCache.values()) {
                if (!s.destroyed) s.visible = false;
            }
            return;
        }

        const total = GRID_SIZE * GRID_SIZE;

        for (let i = 0; i < total; i++) {
            const rm = engine.resourceMaps;

            // Déterminer les ressources présentes sur cette case
            const presents: string[] = [];
            if (rm.coal[i] > RESOURCE_THRESHOLD) presents.push('COAL');
            if (rm.gold[i] > RESOURCE_THRESHOLD) presents.push('GOLD');
            if (rm.iron[i] > RESOURCE_THRESHOLD) presents.push('IRON');
            if (rm.oil[i] > RESOURCE_THRESHOLD) presents.push('OIL');
            if (rm.silver[i] > RESOURCE_THRESHOLD) presents.push('SILVER');
            if (rm.stone[i] > RESOURCE_THRESHOLD) presents.push('STONE');
            if (rm.undergroundWater[i] > RESOURCE_THRESHOLD) presents.push('WATER');

            // Filtrer selon le layer actif ('all' = tout afficher, sinon la clé exacte)
            const toShow = activeLayer === 'all'
                ? presents
                : presents.filter(r => r.toLowerCase() === activeLayer.toLowerCase());

            // Pour simplifier : on prend la première ressource de la case (icône unique)
            const resKey = toShow[0] ?? null;
            const cacheKey = `${i}_${resKey ?? 'none'}`;

            if (!resKey) {
                // Cacher les vieilles icônes sur cette case
                for (const k of [`${i}_COAL`, `${i}_GOLD`, `${i}_IRON`, `${i}_OIL`, `${i}_SILVER`, `${i}_STONE`, `${i}_WATER`]) {
                    const old = iconCache.get(k);
                    if (old && !old.destroyed) old.visible = false;
                }
                continue;
            }

            // Vérifier si la texture est prête
            const tex = texCache.get(resKey);
            if (!tex) {
                loadTex(resKey); // Déclenche le chargement async
                continue;
            }

            let sprite = iconCache.get(cacheKey);
            if (!sprite || sprite.destroyed) {
                sprite = new PIXI.Sprite(tex);
                sprite.anchor.set(0.5, 1.0);
                // Icône ~60% de la largeur d'une tuile
                const scale = (TILE_WIDTH * 0.6) / tex.width;
                sprite.scale.set(scale);
                sprite.alpha = 0.85;
                container.addChild(sprite);
                iconCache.set(cacheKey, sprite);
            }

            const pos = isoPos(i);
            sprite.x = pos.x;
            sprite.y = pos.y;
            sprite.zIndex = (i % GRID_SIZE) + Math.floor(i / GRID_SIZE) + 0.3;
            sprite.visible = true;
        }
    }

    static clearAll(container: PIXI.Container) {
        for (const sprite of iconCache.values()) {
            if (!sprite.destroyed) sprite.destroy();
        }
        iconCache.clear();
    }
}
