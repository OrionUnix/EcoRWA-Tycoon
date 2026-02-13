import { createNoise2D } from 'simplex-noise';
import { MapEngine } from '../MapEngine';
import { GRID_SIZE } from '../config';
import { LayerType, BiomeType } from '../types';
import { BIOME_SIGNATURES, ResourceRule } from '../data/biomeData';

// Copie de la fonction RNG (Si tu ne l'as pas mise dans un fichier à part)
function createSeededRandom(seedStr: string) {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
        seed |= 0;
    }
    return () => {
        var t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export class MapGenerator {

    private static fbm(x: number, y: number, octaves: number, noiseFunc: (x: number, y: number) => number): number {
        let value = 0, amplitude = 0.5, frequency = 1;
        for (let i = 0; i < octaves; i++) {
            value += noiseFunc(x * frequency, y * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        return (value + 1) * 0.5;
    }

    // ✅ MODIFICATION : Masque plus large et moins agressif
    private static getIslandMask(x: number, y: number): number {
        const cx = x / GRID_SIZE - 0.5;
        const cy = y / GRID_SIZE - 0.5;

        // Distance du centre (0 au centre, ~1.41 aux coins)
        const d = Math.sqrt(cx * cx + cy * cy) * 2;

        // On adoucit la courbe pour avoir un plateau central plus grand
        // 'd' doit être > 0.8 pour commencer à descendre vers l'océan
        if (d < 0.5) return 1; // Centre pur = Terre garantie

        // Décroissance douce vers les bords
        return Math.max(0, 1 - Math.pow(d - 0.2, 2));
    }

    static generate(engine: MapEngine, walletAddress: string = "default_seed") {
        console.log(`🌱 MapGenerator: Génération (Seed: ${walletAddress})...`);

        const rng = createSeededRandom(walletAddress);
        const terrainNoise = createNoise2D(rng);
        const moistureNoise = createNoise2D(rng);
        const riverNoise = createNoise2D(rng);
        const resNoise = createNoise2D(rng);

        // Reset
        engine.biomes.fill(0);
        engine.heightMap.fill(0);

        const waterLayer = engine.getLayer(LayerType.WATER); // Vérifie que c'est bien WATER ou TERRAIN selon tes types
        const terrainLayer = engine.getLayer(LayerType.TERRAIN);
        const resLayer = engine.getLayer(LayerType.RESOURCES);

        waterLayer.fill(0);
        terrainLayer.fill(0);
        resLayer.fill(0);
        Object.values(engine.resourceMaps).forEach(map => map.fill(0));

        // 🔧 RÉGLAGES BOOSTÉS POUR PLUS DE TERRE
        const scale = 0.015;     // Zoom bruit (plus petit = continents plus gros)
        const globalHeightShift = 0.15; // ⬆️ Remonte tout le terrain de 15%

        const offsetX = rng() * 1000;
        const offsetY = rng() * 1000;

        let landCount = 0; // Pour le debug stats

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;
                const nx = (x + offsetX) * scale;
                const ny = (y + offsetY) * scale;

                // 1. Hauteur de base
                let h = this.fbm(nx, ny, 5, terrainNoise);
                const m = this.fbm(nx, ny, 2, moistureNoise);

                // 2. Application du Masque (Île)
                const mask = this.getIslandMask(x, y);

                // Mélange : 60% Bruit Naturel + 40% Forme d'île
                // + globalHeightShift pour sortir de l'eau
                h = (h * 0.6) + (mask * 0.4) + globalHeightShift;

                // RIVIÈRES (inchangees)
                const rVal = Math.abs(riverNoise(x * 0.025, y * 0.025));
                let isRiver = false;
                if (h > 0.35 && h < 0.7 && rVal < 0.03) isRiver = true;

                // Stockage hauteur
                engine.heightMap[i] = h;
                engine.moistureMap[i] = m;
                terrainLayer[i] = h;

                // --- DÉCISION BIOME ---
                let biome = BiomeType.PLAINS;

                // Seuils ajustés
                if (h < 0.25) { // Était 0.35
                    biome = BiomeType.DEEP_OCEAN;
                    waterLayer[i] = 1.0;
                }
                else if (h < 0.32) { // Était 0.45
                    biome = BiomeType.OCEAN;
                    waterLayer[i] = 0.8;
                }
                else if (isRiver) {
                    biome = BiomeType.OCEAN; // Ou RIVER si tu as le type
                    waterLayer[i] = 0.6;
                    engine.heightMap[i] -= 0.05; // Creuser visuellement
                }
                else if (h < 0.36) {
                    biome = BiomeType.BEACH;
                    landCount++;
                }
                else if (h > 0.85) {
                    biome = BiomeType.MOUNTAIN;
                    landCount++;
                }
                else {
                    // Terre ferme
                    landCount++;
                    if (m < 0.3) biome = BiomeType.DESERT;
                    else if (m > 0.55) biome = BiomeType.FOREST;
                    else biome = BiomeType.PLAINS;
                }

                engine.biomes[i] = biome;

                // --- GÉNÉRATION RESSOURCES (Simplifiée pour lisibilité) ---
                if (biome !== BiomeType.DEEP_OCEAN && biome !== BiomeType.OCEAN) {
                    const rule = BIOME_SIGNATURES[biome] || BIOME_SIGNATURES[BiomeType.PLAINS];

                    const applyRes = (targetMap: any, r: any, noiseOffset: number) => {
                        if (!targetMap || !r || r.chance <= 0) return;
                        if (r === rule.wood && biome !== BiomeType.FOREST) return; // Bois seulement en forêt

                        const n = resNoise(nx + noiseOffset, ny + noiseOffset);
                        if (n > (1 - r.chance * 2.5)) {
                            targetMap[i] = r.intensity * Math.abs(n);
                            resLayer[i] = Math.max(resLayer[i], targetMap[i]);
                        }
                    };

                    // Applique tes ressources ici (je mets les principales pour l'exemple)
                    applyRes(engine.resourceMaps.wood, rule.wood, 10);
                    applyRes(engine.resourceMaps.stone, (rule as any).stone, 20);
                    applyRes(engine.resourceMaps.oil, rule.oil, 30);
                    applyRes(engine.resourceMaps.food, rule.animals, 40); // Simplifié
                }
            }
        }

        engine.calculateSummary();
        engine.revision++;

        const landPercent = Math.floor((landCount / (GRID_SIZE * GRID_SIZE)) * 100);
        console.log(`✅ MapGenerator: Terminé. Terre habitable: ${landPercent}%`);
    }
}