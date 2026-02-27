import { BuildingData, RoadData, RoadType, BuildingType, ZoneData, ZoneType } from '../types';
import { GRID_SIZE, TOTAL_CELLS, CHUNKS_PER_SIDE } from '../config';
import { ChunkManager } from '../ChunkManager';
import { MapEngine } from '../MapEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// SaveUtils — Pure fonctions de compression/décompression (Array Packing)
// Stateless. Utilisé par SaveSystem.ts pour optimiser le payload Firebase.
// ═══════════════════════════════════════════════════════════════════════════════

const BUILDING_TYPE_LIST = Object.values(BuildingType);
const ROAD_TYPE_LIST = Object.values(RoadType);
const ZONE_TYPE_LIST = Object.values(ZoneType);

export class SaveUtils {

    /** État: 0=CONSTRUCTION→restauré ACTIVE, 1=ACTIVE, 2=ABANDONED */
    private static _stateToIdx(s: string): number {
        if (s === 'ACTIVE') return 1;
        if (s === 'ABANDONED') return 2;
        return 0; // CONSTRUCTION
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPRESSION (Pack)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compresse la couche de bâtiments
     */
    static packBuildings(layer: (BuildingData | null)[]): string {
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

            // Texture RWA si applicable, pour le fallback visuel
            if (b.rwaTexture) packed.push(b.rwaTexture);

            result.push(packed);
        }
        return JSON.stringify(result);
    }

    /**
     * Récupère la liste spécifique des RWA pour l'indexage Wallet -> Cell
     */
    static packRWA(layer: (BuildingData | null)[]): (number | string)[][] {
        const rwaList: (number | string)[][] = [];
        for (let i = 0; i < layer.length; i++) {
            const b = layer[i];
            // Format exigé: [cellIndex, type, shares (dummy for now)]
            if (b && b.rwaTexture) {
                // Pour l'instant nous stockons 1 part par défaut, l'économie on-chain gérera le vrai chiffre
                rwaList.push([i, b.type, 1]);
            }
        }
        return rwaList;
    }

    static packRoads(layer: (RoadData | null)[]): string {
        const result: number[][] = [];
        for (let i = 0; i < layer.length; i++) {
            if (!layer[i]) continue;
            result.push([ROAD_TYPE_LIST.indexOf(layer[i]!.type), i]);
        }
        return JSON.stringify(result);
    }

    static packZones(layer: (ZoneData | null)[]): string {
        const result: number[][] = [];
        for (let i = 0; i < layer.length; i++) {
            const z = layer[i];
            if (!z) continue;
            result.push([ZONE_TYPE_LIST.indexOf(z.type as ZoneType), i, z.level ?? 1]);
        }
        return JSON.stringify(result);
    }

    static packChunks(): string {
        const center = Math.floor(CHUNKS_PER_SIDE / 2);
        const result: number[][] = [];
        for (let cy = 0; cy < CHUNKS_PER_SIDE; cy++) {
            for (let cx = 0; cx < CHUNKS_PER_SIDE; cx++) {
                if (ChunkManager.unlocked[cy][cx] && !(cx === center && cy === center)) {
                    result.push([cx, cy]);
                }
            }
        }
        return JSON.stringify(result);
    }

    static packResources(maps: any): Record<string, string> {
        const res: Record<string, string> = {};
        for (const [key, f32] of Object.entries(maps)) {
            let str = "";
            const arr = f32 as Float32Array;
            for (let i = 0; i < arr.length; i++) {
                const val = arr[i];
                str += (val === 0 ? "" : val.toFixed(2)) + ",";
            }
            res[key] = str.slice(0, -1);
        }
        return res;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DÉCOMPRESSION (Unpack)
    // ─────────────────────────────────────────────────────────────────────────

    static unpackBuildings(packedString: string): (BuildingData | null)[] {
        const layer: (BuildingData | null)[] = new Array(TOTAL_CELLS).fill(null);
        if (!packedString) return layer;

        const packed = JSON.parse(packedString) as (number | string)[][];
        for (const arr of packed) {
            const typeIdx = arr[0] as number;
            if (typeIdx < 0 || typeIdx >= BUILDING_TYPE_LIST.length) continue;
            const type = BUILDING_TYPE_LIST[typeIdx] as BuildingType;
            const x = arr[1] as number;
            const y = arr[2] as number;
            const level = arr[3] as number;
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

    static unpackRoads(packedString: string): (RoadData | null)[] {
        const layer: (RoadData | null)[] = new Array(TOTAL_CELLS).fill(null);
        if (!packedString) return layer;

        const packed = JSON.parse(packedString) as number[][];
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

    static unpackZones(packedString: string): (ZoneData | null)[] {
        const layer: (ZoneData | null)[] = new Array(TOTAL_CELLS).fill(null);
        if (!packedString) return layer;

        const packed = JSON.parse(packedString) as number[][];
        for (const [typeIdx, tileIdx, level] of packed) {
            layer[tileIdx] = {
                type: ZONE_TYPE_LIST[typeIdx] as ZoneType,
                level: level ?? 1,
                population: 0,
            };
        }
        return layer;
    }

    static unpackChunks(packedString: string): void {
        if (!packedString) return;
        const packed = JSON.parse(packedString) as number[][];
        for (const [cx, cy] of packed) {
            if (cx >= 0 && cx < CHUNKS_PER_SIDE && cy >= 0 && cy < CHUNKS_PER_SIDE) {
                ChunkManager.unlocked[cy][cx] = true;
            }
        }
        console.log(`🗺️ [SaveUtils] ${packed.length} chunks additionnels restaurés.`);
    }

    static unpackResources(engine: MapEngine, packed: Record<string, string>): void {
        for (const [key, str] of Object.entries(packed)) {
            const map = (engine.resourceMaps as any)[key] as Float32Array;
            if (!map) continue;
            const vals = str.split(',');
            for (let i = 0; i < vals.length; i++) {
                map[i] = vals[i] === "" ? 0 : parseFloat(vals[i]);
            }
        }
        console.log(`⛏️ [SaveUtils] Ressources géologiques restaurées.`);
    }
}
