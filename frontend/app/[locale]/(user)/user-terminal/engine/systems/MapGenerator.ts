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

    // ✅ NOUVEAU : Crée un masque pour forcer une île au centre (DÉSACTIVÉ: Mode Continent)
    /*
    private static getIslandMask(x: number, y: number, noiseVal: number): number {
        // Distance par rapport au centre (0 à 1)
        const cx = x / GRID_SIZE - 0.5;
        const cy = y / GRID_SIZE - 0.5;

        // Perturbation du cercle avec le bruit (Noise)
        // Distortion TRÈS aggressive (1.5) et basée sur radius
        // noiseVal est entre -0.5 et 0.5

        // On module le rayon effectif du cercle selon l'angle via le noise map 2D
        // Si noiseVal est positif, le "bord" est repoussé (Terre plus loin)
        // Si négatif, le "bord" est rapproché (Baie creusée)
        const radiusMod = 1.0 + (noiseVal * 2.0); // Varie de 0.0 à 2.0

        // Distance modifiée
        const d = Math.sqrt(cx * cx + cy * cy) * 2 / radiusMod;

        // On inverse : 1 si d < 1, falloff rapide ensuite
        // Smoothstep inversé pour un bord net mais antialiased
        const circle = Math.max(0, 1.2 - d); // 1.2 pour laisser une marge avant le falloff
        return Math.min(1, circle);
    }
    */

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
            let t = seed += 0x6D2B79F5;
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
        const resNoise = createNoise2D(rng); // Not used explicitly but good practice

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

        // 🔧 RÉGLAGES: Scale réduit à 0.18 = features plus grandes (continents vs océans)
        // Note: < 0.15 = trop lisse (un seul blob), > 0.35 = trop morcelé (archipel)
        const scale = 0.18;
        const riverScale = 0.3;

        // ✅ CRUCIAL: Utiliser rng() pour les offsets, sinon c'est toujours pareil ou aléatoire non-contrôlé
        const offsetX = rng() * 10000;
        const offsetY = rng() * 10000;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;

                const nx = (x + offsetX) * scale;
                const ny = (y + offsetY) * scale;

                // 1. Hauteur de base (Terrain) — FBM pur, pas de masque
                // 🔑 FIX: Le masque côtier (gradient Y) était la VRAIE cause des 70% d'eau.
                // Il écrasait h vers 0 dans toute la moitié basse de la carte.
                // On utilise uniquement le bruit de Perlin pour décider du terrain.
                let h = this.fbm(nx, ny, 6, terrainNoise);
                const m = this.fbm(nx, ny, 2, moistureNoise);

                // 3. ✅ GÉNÉRATION DES RIVIÈRES
                const rVal = Math.abs(riverNoise(x * riverScale, y * riverScale));
                let isRiver = false;

                if (h > 0.35 && h < 0.8 && rVal < 0.035) {
                    isRiver = true;
                }

                engine.heightMap[i] = h;
                engine.moistureMap[i] = m;
                terrainLayer[i] = h;

                // --- DÉCISION BIOME (RADICALE) ---
                let biome = BiomeType.PLAINS;

                // ✅ SEUILS AGRESSIFS (Objectif: 80% Terre)
                if (h < 0.15) {
                    biome = BiomeType.DEEP_OCEAN;
                    waterLayer[i] = 1.0;
                }
                else if (h < 0.20) {
                    biome = BiomeType.OCEAN;
                    waterLayer[i] = 0.8;
                }
                else if (isRiver) {
                    biome = BiomeType.OCEAN;
                    waterLayer[i] = 0.6;
                    engine.heightMap[i] -= 0.05;
                }
                // ✅ Plage réduite à une fine bande (0.20 -> 0.23)
                // Tout ce qui est > 0.23 est maintenant TERRE
                else if (h < 0.23) {
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
                    if (r.minHeight && h < r.minHeight) return;
                    if (r.maxHeight && h > r.maxHeight) return;

                    // Bruit spécifique pour cette ressource
                    const n = resNoise(x * 0.1 + noiseOffset, y * 0.1 + noiseOffset);
                    if (n > (1 - r.chance)) {
                        let amount = r.intensity;
                        // Variation aléatoire + ou - 20%
                        amount *= (0.8 + rng() * 0.4);
                        targetMap[i] = amount;
                    }
                };

                applyRes(engine.resourceMaps.oil, rule.oil, 0, 'oil');
                applyRes(engine.resourceMaps.coal, rule.coal, 100, 'coal');
                applyRes(engine.resourceMaps.iron, rule.iron, 200, 'iron');
                applyRes(engine.resourceMaps.wood, rule.wood, 300, 'wood');
                applyRes(engine.resourceMaps.animals, rule.animals, 400);
                applyRes(engine.resourceMaps.fish, rule.fish, 500);

                applyRes(engine.resourceMaps.gold, rule.gold, 600);
                applyRes(engine.resourceMaps.silver, rule.silver, 700);
                applyRes(engine.resourceMaps.stone, rule.stone, 800);
            }
        }
    }
}