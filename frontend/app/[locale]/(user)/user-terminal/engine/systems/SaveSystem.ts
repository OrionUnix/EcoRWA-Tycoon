import { MapEngine } from '../MapEngine';
import { BuildingData, RoadData, RoadType, BuildingType, ZoneData, ZoneType } from '../types';
import { GRID_SIZE, TOTAL_CELLS, CHUNKS_PER_SIDE } from '../config';
import { RoadManager } from '../RoadManager';
import { ChunkManager } from '../ChunkManager';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { SaveUtils } from './SaveUtils';
import { PopulationManager } from './PopulationManager';

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

    public static get isDirty(): boolean { return this._isDirty; }
    public static clearDirty(): void { this._isDirty = false; }

    static hasSave(): boolean { return false; } // LocalStorage disabled. Cloud managed.

    static clearSave(): void {
        this._isDirty = false;
        if (this._debounceId !== null) clearTimeout(this._debounceId);
        console.log('🗑️ [SaveSystem] Sauvegarde locale effacée (Déprécié).');
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
                // Auto-save géré par le interval de UserTerminalClient pour le cloud
                this._isDirty = false;
            }
        }, this.DEBOUNCE_MS);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SAUVEGARDE CLOUD (FIRESTORE)
    // ─────────────────────────────────────────────────────────────────────────
    static async saveToCloud(engine: MapEngine, walletAddress: string): Promise<SaveResult | null> {
        if (!walletAddress) {
            console.warn("⚠️ [SaveSystem] Impossible de sauvegarder sur le cloud: Pas d'adresse wallet.");
            return null;
        }

        const totalPop = PopulationManager.getTotalPopulation();
        const totalJobs = PopulationManager.getTotalJobs();
        const unemployed = Math.max(0, totalPop - totalJobs);

        const saveData = {
            v: SAVE_VERSION,
            ts: Date.now(),
            b: SaveUtils.packBuildings(engine.buildingLayer),
            r: SaveUtils.packRoads(engine.roadLayer),
            z: SaveUtils.packZones(engine.zoningLayer),
            c: SaveUtils.packChunks(),
            res: SaveUtils.packResources(engine.resourceMaps),
            rwa: SaveUtils.packRWA(engine.buildingLayer),
            eco: {
                money: (engine.resources as any).money ?? 0,
                happiness: engine.stats?.happiness ?? 80,
                totalPopulation: totalPop,
                totalJobs: totalJobs,
                unemployed: unemployed
            },
        };

        try {
            const docRef = doc(db, 'saves', walletAddress.toLowerCase());
            await setDoc(docRef, saveData); // Écrase l'ancienne save ou la crée

            const sizeKB = parseFloat((JSON.stringify(saveData).length / 1024).toFixed(2));
            console.log(`☁️ [SaveSystem] Cloud Save réussie ! — ${sizeKB} Ko (${saveData.b.length} bâtiments)`);
            return { sizeKB, timestamp: saveData.ts };
        } catch (error) {
            console.error("❌ [SaveSystem] Erreur Cloud Save:", error);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHARGEMENT CLOUD (FIRESTORE)
    // ─────────────────────────────────────────────────────────────────────────
    static async loadFromCloud(walletAddress: string): Promise<any | null> {
        if (!walletAddress) return null;

        try {
            const docRef = doc(db, 'saves', walletAddress.toLowerCase());
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                if (!data || data.v !== SAVE_VERSION) {
                    console.warn('[SaveSystem] Save Cloud incompatible (v%s ≠ v%s).', data?.v, SAVE_VERSION);
                    return null;
                }

                return data; // Retourne le JSON brut compressé pour que UserTerminalClient/GameEngine le décompresse
            } else {
                return null;
            }
        } catch (error) {
            console.error("❌ [SaveSystem] Erreur Cloud Load:", error);
            return null;
        }
    }

    /**
     * Appelé après loadFromCloud pour injecter la donnée décompressée dans le GameEngine
     */
    static restoreIntoEngine(engine: MapEngine, data: any): boolean {
        try {
            // ── Restaurer couches de données ──────────────────────────────────
            engine.buildingLayer = SaveUtils.unpackBuildings(data.b || "[]");
            engine.roadLayer = SaveUtils.unpackRoads(data.r || "[]");
            engine.zoningLayer = SaveUtils.unpackZones(data.z || "[]");

            // ── ✅ Restaurer chunks débloqués ─────────────────────────────────
            if (data.c) SaveUtils.unpackChunks(data.c);

            // ── ✅ Restaurer ressources locales ───────────────────────────────
            if (data.res) SaveUtils.unpackResources(engine, data.res);

            // ── Reconstruire le RoadGraph (critique pour les véhicules) ───────
            for (let i = 0; i < TOTAL_CELLS; i++) {
                if (engine.roadLayer[i]) {
                    RoadManager.updateConnections(engine, i);
                }
            }

            // ── Restaurer l'économie et la population globale ─────────────────
            if (data.eco) {
                if (engine.resources) (engine.resources as any).money = data.eco.money ?? 0;

                // On restaure les métriques démographiques avec précaution (RAZ préalable du PopulationManager)
                const popToRestore = data.eco.totalPopulation ?? 0;
                // Le PopulationManager va recalculer unitairement, mais au cas où il nous faut écraser l'affichage :
                PopulationManager.reset(); // Règle demandée : on réinitialise pour éviter le cumul !
            }

            engine.revision++;
            console.log(`📂 [SaveSystem] Restauré : ${data.b?.length ?? 0} bâtiments, ${data.r?.length ?? 0} routes, ${(data.c ?? "[]").length} chunks.`);

            if (data.rwa && data.rwa.length > 0) {
                console.log(`🏢 [SaveSystem] Restauration détectée pour ${data.rwa.length} bâtiments RWA (Data Chain in-tact).`);
            }
            return true;

        } catch (e) {
            console.error('[SaveSystem] Erreur restauration Cloud:', e);
            return false;
        }
    }
}
