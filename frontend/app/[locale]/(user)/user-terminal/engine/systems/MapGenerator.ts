import { createNoise2D } from 'simplex-noise';
import { MapEngine } from '../MapEngine';
import { GRID_SIZE } from '../config';
import { LayerType, BiomeType } from '../types';
import { BIOME_SIGNATURES, ResourceRule } from '../data/biomeData';

export class MapGenerator {

    // Fonction mathématique pour créer des paysages naturels (Fractal Brownian Motion)
    private static fbm(x: number, y: number, octaves: number, noiseFunc: (x: number, y: number) => number): number {
        let value = 0, amplitude = 0.5, frequency = 1;
        for (let i = 0; i < octaves; i++) {
            value += noiseFunc(x * frequency, y * frequency) * amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        return (value + 1) * 0.5;
    }

    static generate(engine: MapEngine) {
        console.log("🌱 MapGenerator: Démarrage de la génération...");

        const seed = Math.random();
        const terrainNoise = createNoise2D(() => seed);
        const moistureNoise = createNoise2D(() => seed + 1);
        const resNoise = createNoise2D(() => seed + 2);

        // Reset des données
        engine.biomes.fill(0);
        engine.heightMap.fill(0);

        const waterLayer = engine.getLayer(LayerType.WATER);
        const terrainLayer = engine.getLayer(LayerType.TERRAIN);
        const resLayer = engine.getLayer(LayerType.RESOURCES);

        waterLayer.fill(0);
        terrainLayer.fill(0);
        resLayer.fill(0);

        Object.values(engine.resourceMaps).forEach(map => map.fill(0));

        const scale = 0.03;
        const offsetX = Math.random() * 1000;
        const offsetY = Math.random() * 1000;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;

                const nx = (x + offsetX) * scale;
                const ny = (y + offsetY) * scale;

                const h = this.fbm(nx, ny, 4, terrainNoise);
                const m = this.fbm(nx, ny, 2, moistureNoise);

                engine.heightMap[i] = h;
                engine.moistureMap[i] = m;
                terrainLayer[i] = h;

                // --- DÉCISION BIOME ---
                let biome = BiomeType.PLAINS;

                if (h < 0.35) {
                    biome = BiomeType.DEEP_OCEAN;
                    waterLayer[i] = 1.0;
                }
                else if (h < 0.45) {
                    biome = BiomeType.OCEAN;
                    waterLayer[i] = 0.8;
                }
                else if (h < 0.48) {
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
                    if (resourceType === 'wood' && biome !== BiomeType.FOREST) {
                        targetMap[i] = 0;
                        return;
                    }
                    const n = resNoise(nx + noiseOffset, ny + noiseOffset);
                    if (n > (1 - r.chance * 2.5)) {
                        const amount = r.intensity * Math.abs(n);
                        targetMap[i] = amount;
                        resLayer[i] = Math.max(resLayer[i], amount);
                    }
                };

                // Ressources Standard
                applyRes(engine.resourceMaps.oil, rule.oil, 10);
                applyRes(engine.resourceMaps.coal, rule.coal, 20);
                applyRes(engine.resourceMaps.iron, rule.iron, 30);
                applyRes(engine.resourceMaps.wood, rule.wood, 40, 'wood');

                // Nouvelles Ressources (Assurez-vous qu'elles existent dans biomeData.ts)
                applyRes(engine.resourceMaps.stone, (rule as any).stone, 70);
                applyRes(engine.resourceMaps.silver, (rule as any).silver, 80);
                applyRes(engine.resourceMaps.gold, (rule as any).gold, 90);

                // Ressources Vivantes
                applyRes(engine.resourceMaps.animals, rule.animals, 50);
                applyRes(engine.resourceMaps.fish, rule.fish, 60);

                // Cas spécial Food (souvent lié à l'humidité/fertilité des plaines)
                if (h < 0.45) {
                    biome = BiomeType.OCEAN; // 👈 Priorité absolue à l'eau
                } else {
                    // Les arbres ne sont décidés QUE si on est au-dessus de l'eau
                    if (m > 0.6) biome = BiomeType.FOREST;
                    else biome = BiomeType.PLAINS;
                }
                if (biome !== BiomeType.FOREST) {
                    engine.resourceMaps.wood[i] = 0;
                }
            }
        }

        engine.calculateSummary();
        engine.revision++;
        console.log("✅ MapGenerator: Génération terminée.");
    }
}