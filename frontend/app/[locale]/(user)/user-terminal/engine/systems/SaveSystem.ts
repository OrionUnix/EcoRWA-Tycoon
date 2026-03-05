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
const SAVE_VERSION = 6;

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

    public static get isDirty(): boolean { return this._isDirty; }
    public static markAsDirty(): void { this._isDirty = true; }
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
            inventory: {
                wood: engine.resources.wood || 0,
                stone: engine.resources.stone || 0,
                coal: engine.resources.coal || 0,
                iron: engine.resources.iron || 0,
                gold: engine.resources.gold || 0,
                silver: engine.resources.silver || 0,
                oil: engine.resources.oil || 0,
                food: engine.resources.food || 0,
                concrete: engine.resources.concrete || 0,
                glass: engine.resources.glass || 0,
                steel: engine.resources.steel || 0,
                undergroundWater: engine.resources.undergroundWater || 0,
                electricity: engine.resources.electricity || 0,
                water: engine.resources.water || 0
            },
            flags: {
                hasClaimedGrant: engine.flags.hasClaimedGrant,
                hasSeenTutorial: engine.flags.hasSeenTutorial,
                lastFaucetClaim: engine.flags.lastFaucetClaim
            },
            seed: engine.mapSeed || "",
            rwa_balances: engine.rwaBalances || {}
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

            // ── ✅ Restaurer l'inventaire ─────────────────────────────────────
            if (data.inventory && engine.resources) {
                const inv = data.inventory;
                engine.resources.wood = inv.wood || 0;
                engine.resources.stone = inv.stone || 0;
                engine.resources.coal = inv.coal || 0;
                engine.resources.iron = inv.iron || 0;
                engine.resources.gold = inv.gold || 0;
                engine.resources.silver = inv.silver || 0;
                engine.resources.oil = inv.oil || 0;
                engine.resources.food = inv.food || 0;
                engine.resources.concrete = inv.concrete || 0;
                engine.resources.glass = inv.glass || 0;
                engine.resources.steel = inv.steel || 0;
                engine.resources.undergroundWater = inv.undergroundWater || 0;
                engine.resources.electricity = inv.electricity || 0;
                engine.resources.water = inv.water || 0;
                console.log("📦 Inventaire chargé avec succès !", inv);
            }

            // ── ✅ Restaurer les Flags ────────────────────────────────────────
            if (data.flags) {
                engine.flags.hasClaimedGrant = data.flags.hasClaimedGrant || false;
                engine.flags.hasSeenTutorial = data.flags.hasSeenTutorial || false;
                engine.flags.lastFaucetClaim = data.flags.lastFaucetClaim || 0;
            }

            // ── ✅ Seed et Balances RWA ───────────────────────────────────────
            if (data.seed) engine.mapSeed = data.seed;
            if (data.rwa_balances) engine.rwaBalances = data.rwa_balances;

            // ── ✅ Progression Hors-Ligne ─────────────────────────────────────
            if (data.ts) {
                const now = Date.now();
                const deltaMs = now - data.ts;
                const deltaHours = deltaMs / (1000 * 60 * 60);

                if (deltaHours > 0.01) { // Plus de 36 secondes d'absence
                    SaveSystem.processOfflineGains(engine, deltaHours, data.eco?.totalPopulation ?? 0);
                }
            }

            engine.revision++;
            console.log(`📂 [SaveSystem] Restauré : ${data.b?.length ?? 0} bâtiments, ${data.r?.length ?? 0} routes, ${(data.c ?? "[]").length} chunks.`);

            if (data.rwa) {
                try {
                    const rwaList = typeof data.rwa === 'string' ? JSON.parse(data.rwa) : data.rwa;
                    if (rwaList && rwaList.length > 0) {
                        console.log(`🏢 [SaveSystem] Restauration détectée pour ${rwaList.length} bâtiments RWA.`);
                    }
                } catch (e) {
                    console.warn("⚠️ [SaveSystem] Erreur parsing RWA data:", e);
                }
            }
            return true;

        } catch (e) {
            console.error('[SaveSystem] Erreur restauration Cloud:', e);
            return false;
        }
    }

    /**
     * Traite les gains "idle" basés sur un écart de temps (en heures)
     * Peut être appelé au chargement de la sauvegarde, ou lors du retour de l'utilisateur sur la page
     */
    public static processOfflineGains(engine: MapEngine, deltaHours: number, fallbackPopulation?: number): void {
        console.log(`⏳ [SaveSystem] Calcul de la progression idle (${deltaHours.toFixed(4)}h)...`);

        let offlineMoney = 0;

        // 1. Taxes (10$/h par habitant)
        // Utilise la pop actuelle dans le moteur, ou un fallback venant de la sauvegarde brute
        const population = PopulationManager.getTotalPopulation() || fallbackPopulation || 0;
        const taxIncome = population * 10 * deltaHours;
        offlineMoney += taxIncome;

        // 2. Yields RWA
        let rwaYields = 0;
        const now = Date.now();
        engine.buildingLayer.forEach(b => {
            if (b && b.rwaId) {
                // Yield basique pour test
                rwaYields += 5 * deltaHours;
                b.lastYieldClaim = now;
            }
        });
        offlineMoney += rwaYields;

        if (offlineMoney > 0) {
            engine.resources.money += Math.floor(offlineMoney);
            console.log(`💰 [SaveSystem] Gain Idle : $${Math.floor(offlineMoney)} (Taxes: $${Math.floor(taxIncome)}, RWA: $${Math.floor(rwaYields)})`);

            // Notifie l'UI
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('offline_gains', {
                    detail: {
                        total: Math.floor(offlineMoney),
                        taxes: Math.floor(taxIncome),
                        rwa: Math.floor(rwaYields),
                        hours: deltaHours
                    }
                }));
            }
        }
    }
}
