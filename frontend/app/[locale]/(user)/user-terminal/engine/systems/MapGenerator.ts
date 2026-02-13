import { createNoise2D } from 'simplex-noise';
import { MapEngine } from '../MapEngine';
import { GRID_SIZE } from '../config';
import { LayerType, BiomeType } from '../types';
import { BIOME_SIGNATURES, ResourceRule } from '../data/biomeData';

export class MapGenerator {

    // Fractal Brownian Motion (inchangé, c'est très bien)
    private static fbm(x: number, y: number, octaves: number, noiseFunc: (x: number, y: number) => number): number {
        let value = 0, amplitude = 0.5, frequency = 1;
        for (let i = 0; i < octaves; i++) {
            value += noiseFunc(x * frequency, y * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        return (value + 1) * 0.5; // Normalise entre 0 et 1
    }

    // ✅ NOUVEAU : Crée un masque pour forcer une île au centre
    private static getIslandMask(x: number, y: number): number {
        // Distance par rapport au centre (0 à 1)
        const cx = x / GRID_SIZE - 0.5;
        const cy = y / GRID_SIZE - 0.5;
        const d = Math.sqrt(cx * cx + cy * cy) * 2; // *2 pour que les bords soient à 1.0

        // On inverse : 1 au centre, 0 aux bords.
        // On utilise une puissance (Math.pow) pour rendre le "plateau" central plus large
        // Modifié pour moins d'effet "Archipel" : plus de terre
        return Math.max(0, 1 - Math.pow(d, 2.5)); // 1.5 -> 2.5 (Plateau plus large)
    }

    // Un algorithme simple (Mulberry32) pour générer des nombres aléatoires à partir d'une graine
    private static createSeededRandom(seedStr: string): () => number {
        let seed = 0;
        for (let i = 0; i < seedStr.length; i++) {
            // Hash simple pour transformer "0x..." en nombre
            seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
            seed |= 0; // Force en entier 32bit
        }
        // Mulberry32 (Générateur pseudo-aléatoire rapide)
        return () => {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    static generate(engine: MapEngine, walletAddress?: string) {
        console.log("🌱 MapGenerator: Démarrage de la génération...");

        // Utilisation de la Seed du Wallet si disponible
        let rng: () => number;
        if (walletAddress) {
            console.log(`🔑 Generating map for wallet: ${walletAddress}`);
            rng = this.createSeededRandom(walletAddress);
        } else {
            console.log(`🎲 Generating random map`);
            rng = Math.random;
        }

        // Création des générateurs de bruit
        // createNoise2D attend une fonction () => number. rng est compatible.
        const terrainNoise = createNoise2D(rng);
        const moistureNoise = createNoise2D(rng);
        const riverNoise = createNoise2D(rng);
        const resNoise = createNoise2D(rng);

        // Reset des layers
        engine.biomes.fill(0);
        engine.heightMap.fill(0);

        const waterLayer = engine.getLayer(LayerType.WATER);
        const terrainLayer = engine.getLayer(LayerType.TERRAIN);
        const resLayer = engine.getLayer(LayerType.RESOURCES);

        waterLayer.fill(0);
        terrainLayer.fill(0);
        resLayer.fill(0);
        Object.values(engine.resourceMaps).forEach(map => map.fill(0));

        // 🔧 RÉGLAGES IMPORTANTS
        // Scale réduit (0.015 -> 0.006) pour des continents plus vastes et moins fragmentés
        const scale = 0.006;
        const riverScale = 0.02;
        const offsetX = rng() * 1000;
        const offsetY = rng() * 1000;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;

                const nx = (x + offsetX) * scale;
                const ny = (y + offsetY) * scale;

                // 1. Hauteur de base (Terrain)
                let h = this.fbm(nx, ny, 6, terrainNoise);
                const m = this.fbm(nx, ny, 2, moistureNoise);

                // 2. ✅ APPLIQUER LE MASQUE D'ÎLE
                const mask = this.getIslandMask(x, y);
                // Moins d'influence du masque (0.4 -> 0.25) pour laisser le bruit naturel s'exprimer
                h = (h * 0.75) + (mask * 0.25);

                // Si le masque est trop faible, on baisse doucement au lieu de forcer 0.1
                if (mask < 0.1) h *= mask * 10;

                // 3. ✅ GÉNÉRATION DES RIVIÈRES
                const rVal = Math.abs(riverNoise(x * riverScale, y * riverScale));
                let isRiver = false;

                if (h > 0.35 && h < 0.8 && rVal < 0.035) {
                    isRiver = true;
                }

                engine.heightMap[i] = h;
                engine.moistureMap[i] = m;
                terrainLayer[i] = h;

                // --- DÉCISION BIOME ---
                let biome = BiomeType.PLAINS;

                // Niveaux d'eau abaissés pour plus de terre constructible
                if (h < 0.20) { // 0.30 -> 0.20
                    biome = BiomeType.DEEP_OCEAN;
                    waterLayer[i] = 1.0;
                }
                else if (h < 0.25) { // 0.35 -> 0.25
                    biome = BiomeType.OCEAN;
                    waterLayer[i] = 0.8;
                }
                else if (isRiver) {
                    biome = BiomeType.OCEAN;
                    waterLayer[i] = 0.6;
                    engine.heightMap[i] -= 0.05;
                }
                else if (h < 0.38) {
                    biome = BiomeType.BEACH;
                }
                else if (h > 0.85) {
                    biome = BiomeType.MOUNTAIN;
                }
                else {
                    if (m < 0.3) biome = BiomeType.DESERT;
                    else if (m > 0.6) biome = BiomeType.FOREST;
                    else biome = BiomeType.PLAINS;
                }

                engine.biomes[i] = biome;

                // --- GÉNÉRATION RESSOURCES ---
                const rule = BIOME_SIGNATURES[biome] || BIOME_SIGNATURES[BiomeType.PLAINS];

                const applyRes = (targetMap: Float32Array | undefined, r: ResourceRule | undefined, noiseOffset: number, resourceType?: string) => {
                    if (!targetMap || !r || r.chance <= 0) return;
                    if (resourceType === 'wood' && (isRiver || biome === BiomeType.OCEAN || biome === BiomeType.DEEP_OCEAN)) {
                        targetMap[i] = 0;
                        return;
                    }
                    if (resourceType === 'wood' && biome !== BiomeType.FOREST) { targetMap[i] = 0; return; }

                    const n = resNoise(nx + noiseOffset, ny + noiseOffset);
                    if (n > (1 - r.chance * 2.5)) {
                        const amount = r.intensity * Math.abs(n);
                        targetMap[i] = amount;
                        resLayer[i] = Math.max(resLayer[i], amount);
                    }
                };

                applyRes(engine.resourceMaps.oil, rule.oil, 10);
                applyRes(engine.resourceMaps.coal, rule.coal, 20);
                applyRes(engine.resourceMaps.iron, rule.iron, 30);
                applyRes(engine.resourceMaps.wood, rule.wood, 40, 'wood');

                const r = rule as any;
                if (r.stone) applyRes(engine.resourceMaps.stone, r.stone, 70);
                if (r.silver) applyRes(engine.resourceMaps.silver, r.silver, 80);
                if (r.gold) applyRes(engine.resourceMaps.gold, r.gold, 90);

                applyRes(engine.resourceMaps.animals, rule.animals, 50);
                applyRes(engine.resourceMaps.fish, rule.fish, 60);

                engine.resourceMaps.food[i] = (engine.resourceMaps.animals[i] || 0) + (engine.resourceMaps.fish[i] || 0);
            }
        }

        engine.calculateSummary();
        engine.revision++;
        console.log("✅ MapGenerator: Génération terminée (Continent + Rivières).");
    }
}