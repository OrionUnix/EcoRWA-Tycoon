import { MapEngine } from '../MapEngine';
import { BuildingData, RoadData, RoadType, BuildingType, ZoneData, ZoneType } from '../types';
import { GRID_SIZE, TOTAL_CELLS, CHUNKS_PER_SIDE } from '../config';
import { RoadManager } from '../RoadManager';
import { ChunkManager } from '../ChunkManager';

// ═══════════════════════════════════════════════════════════════════════════════
// SaveSystem v4 — Compression Array Packing + Wallet-Gated + Chunk Unlock Save
//
// Nouveautés v4:
// - Sauvegarde les chunks débloqués → plus besoin de racheter le terrain
// - Wallet-gated : sauvegarde SEULEMENT si wallet connecté
// - États bâtiments 3-valeurs : 0=CONSTRUCTION→ACTIVE, 1=ACTIVE, 2=ABANDONED
// - Reconstruction RoadGraph au chargement
// - Auto-suppression des saves corrompues
// ═══════════════════════════════════════════════════════════════════════════════

const SAVE_KEY = 'eco_rwa_tycoon_save_v4';
const SAVE_VERSION = 4;

// ── Dictionnaires de compression ─────────────────────────────────────────────
const BUILDING_TYPE_LIST = Object.values(BuildingType);
const ROAD_TYPE_LIST = Object.values(RoadType);
const ZONE_TYPE_LIST = Object.values(ZoneType);

export interface SaveResult { sizeKB: number; timestamp: number; }

export class SaveSystem {

    // ── État interne static ───────────────────────────────────────────────────
    private static _isDirty = false;
    private static _debounceId: ReturnType<typeof setTimeout> | null = null;
    private static _engine: MapEngine | null = null;
    private static _walletConnected = false;          // ✅ Wallet-gate
    private static readonly DEBOUNCE_MS = 800;

    // ─────────────────────────────────────────────────────────────────────────
    // API PUBLIQUE
    // ─────────────────────────────────────────────────────────────────────────

    /** Initialise une fois depuis GameEngine */
    static initialize(engine: MapEngine): void {
        this._engine = engine;
        if (typeof window !== 'undefined') {
            window.addEventListener('city_mutated', () => this._onMutation());
        }
    }

    /** Appeler depuis UserTerminalClient quand le wallet se connecte/déconnecte */
    static setWalletConnected(connected: boolean): void {
        this._walletConnected = connected;
        if (connected) {
            console.log('💾 [SaveSystem] Wallet connecté — auto-save activé.');
        } else {
            console.log('💾 [SaveSystem] Wallet déconnecté — auto-save désactivé.');
        }
    }

    static markDirty(): void { this._onMutation(); }

    static hasSave(): boolean { return !!localStorage.getItem(SAVE_KEY); }

    static clearSave(): void {
        localStorage.removeItem(SAVE_KEY);
        this._isDirty = false;
        if (this._debounceId !== null) clearTimeout(this._debounceId);
        console.log('🗑️ [SaveSystem] Sauvegarde effacée.');
    }

    static destroy(): void {
        if (this._debounceId !== null) clearTimeout(this._debounceId);
        this._engine = null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEBOUNCE / AUTO-SAVE
    // ─────────────────────────────────────────────────────────────────────────
    private static _onMutation(): void {
        this._isDirty = true;
        if (this._debounceId !== null) clearTimeout(this._debounceId);
        this._debounceId = setTimeout(() => {
            if (this._isDirty && this._engine && this._walletConnected) {
                this.saveToLocal(this._engine);
                this._isDirty = false;
            }
        }, this.DEBOUNCE_MS);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPRESSION (Pack)
    // ─────────────────────────────────────────────────────────────────────────

    /** État: 0=CONSTRUCTION→restauré ACTIVE, 1=ACTIVE, 2=ABANDONED */
    private static _stateToIdx(s: string): number {
        if (s === 'ACTIVE') return 1;
        if (s === 'ABANDONED') return 2;
        return 0; // CONSTRUCTION
    }

    private static _packBuildings(layer: (BuildingData | null)[]): (number | string)[][] {
        const result: (number | string)[][] = [];
        for (let i = 0; i < layer.length; i++) {
            const b = layer[i];
            if (!b) continue;
            const packed: (number | string)[] = [
                BUILDING_TYPE_LIST.indexOf(b.type as BuildingType),
                b.x, b.y,
                b.level ?? 1,
                this._stateToIdx(b.state ?? 'ACTIVE'),
            ];
            if (b.rwaTexture) packed.push(b.rwaTexture);
            result.push(packed);
        }
        return result;
    }

    private static _packRoads(layer: (RoadData | null)[]): number[][] {
        const result: number[][] = [];
        for (let i = 0; i < layer.length; i++) {
            if (!layer[i]) continue;
            result.push([ROAD_TYPE_LIST.indexOf(layer[i]!.type), i]);
        }
        return result;
    }

    private static _packZones(layer: (ZoneData | null)[]): number[][] {
        const result: number[][] = [];
        for (let i = 0; i < layer.length; i++) {
            const z = layer[i];
            if (!z) continue;
            result.push([ZONE_TYPE_LIST.indexOf(z.type as ZoneType), i, z.level ?? 1]);
        }
        return result;
    }

    /**
     * ✅ Pack les chunks débloqués comme liste de [cx, cy]
     * (le chunk central [n/2, n/2] est toujours débloqué — pas besoin de le sauver)
     */
    private static _packChunks(): number[][] {
        const center = Math.floor(CHUNKS_PER_SIDE / 2);
        const result: number[][] = [];
        for (let cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
            for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {
                if (ChunkManager.unlocked[cy][cx] && !(cx === center && cy === center)) {
                    result.push([cx, cy]);
                }
            }
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DÉCOMPRESSION (Unpack)
    // ─────────────────────────────────────────────────────────────────────────

    private static _unpackBuildings(packed: (number | string)[][]): (BuildingData | null)[] {
        const layer: (BuildingData | null)[] = new Array(TOTAL_CELLS).fill(null);
        for (const arr of packed) {
            const typeIdx = arr[0] as number;
            if (typeIdx < 0 || typeIdx >= BUILDING_TYPE_LIST.length) continue;
            const type = BUILDING_TYPE_LIST[typeIdx] as BuildingType;
            const x = arr[1] as number;
            const y = arr[2] as number;
            const level = arr[3] as number;
            // 0=CONSTRUCTION→ACTIVE (reprend direct), 1=ACTIVE, 2=ABANDONED
            const stateIdx = arr[4] as number;
            const state = stateIdx === 2 ? 'ABANDONED' : 'ACTIVE';
            const rwaTexture = arr[5] as string | undefined;

            layer[y * GRID_SIZE + x] = {
                type, x, y, level, state,
                variant: 0, constructionTimer: 0, pollution: 0,
                happiness: 100, statusFlags: 0, stability: 100, jobsAssigned: 0,
                ...(rwaTexture ? { rwaTexture } : {}),
            };
        }
        return layer;
    }

    private static _unpackRoads(packed: number[][]): (RoadData | null)[] {
        const layer: (RoadData | null)[] = new Array(TOTAL_CELLS).fill(null);
        for (const [typeIdx, tileIdx] of packed) {
            layer[tileIdx] = {
                type: ROAD_TYPE_LIST[typeIdx] as RoadType,
                speedLimit: 50, lanes: 1,
                isTunnel: false, isBridge: false,
                connections: { n: false, s: false, e: false, w: false },
            };
        }
        return layer;
    }

    private static _unpackZones(packed: number[][]): (ZoneData | null)[] {
        const layer: (ZoneData | null)[] = new Array(TOTAL_CELLS).fill(null);
        for (const [typeIdx, tileIdx, level] of packed) {
            layer[tileIdx] = {
                type: ZONE_TYPE_LIST[typeIdx] as ZoneType,
                level: level ?? 1,
                population: 0,
            };
        }
        return layer;
    }

    /** ✅ Restaure les chunks débloqués depuis la save */
    private static _unpackChunks(packed: number[][]): void {
        for (const [cx, cy] of packed) {
            if (cx >= 0 && cx < CHUNKS_PER_SIDE && cy >= 0 && cy < CHUNKS_PER_SIDE) {
                ChunkManager.unlocked[cy][cx] = true;
            }
        }
        console.log(`🗺️ [SaveSystem] ${packed.length} chunks additionnels restaurés.`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SAUVEGARDE
    // ─────────────────────────────────────────────────────────────────────────
    static saveToLocal(engine: MapEngine): SaveResult {
        const saveData = {
            v: SAVE_VERSION,
            ts: Date.now(),
            b: this._packBuildings(engine.buildingLayer),
            r: this._packRoads(engine.roadLayer),
            z: this._packZones(engine.zoningLayer),
            c: this._packChunks(),                          // ✅ Chunks débloqués
            eco: {
                money: (engine.resources as any).money ?? 0,
                happiness: engine.stats?.happiness ?? 80,
            },
        };

        const json = JSON.stringify(saveData);
        localStorage.setItem(SAVE_KEY, json);

        const sizeKB = parseFloat((json.length / 1024).toFixed(2));
        console.log(`💾 [SaveSystem] Sauvegardé — ${sizeKB} Ko (${saveData.b.length} bâtiments, ${saveData.r.length} routes, ${saveData.c.length} chunks extra)`);
        return { sizeKB, timestamp: saveData.ts };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHARGEMENT
    // ─────────────────────────────────────────────────────────────────────────
    static loadIntoEngine(engine: MapEngine): boolean {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;

        try {
            const data = JSON.parse(raw);

            if (!data || data.v !== SAVE_VERSION) {
                console.warn('[SaveSystem] Save incompatible (v%s ≠ v%s) — supprimée.', data?.v, SAVE_VERSION);
                localStorage.removeItem(SAVE_KEY);
                return false;
            }

            // ── Restaurer couches de données ──────────────────────────────────
            engine.buildingLayer = this._unpackBuildings(data.b ?? []);
            engine.roadLayer = this._unpackRoads(data.r ?? []);
            engine.zoningLayer = this._unpackZones(data.z ?? []);

            // ── ✅ Restaurer chunks débloqués ─────────────────────────────────
            if (data.c && Array.isArray(data.c)) {
                this._unpackChunks(data.c);
            }

            // ── Reconstruire le RoadGraph (critique pour les véhicules) ───────
            for (let i = 0; i < TOTAL_CELLS; i++) {
                if (engine.roadLayer[i]) {
                    RoadManager.updateConnections(engine, i);
                }
            }

            // ── Restaurer l'économie ──────────────────────────────────────────
            if (data.eco && engine.resources) {
                (engine.resources as any).money = data.eco.money ?? 0;
            }

            engine.revision++;
            console.log(`📂 [SaveSystem] Restauré : ${data.b?.length ?? 0} bâtiments, ${data.r?.length ?? 0} routes, ${(data.c ?? []).length} chunks extra.`);
            return true;

        } catch (e) {
            console.error('[SaveSystem] Erreur — save supprimée :', e);
            localStorage.removeItem(SAVE_KEY);
            return false;
        }
    }
}
