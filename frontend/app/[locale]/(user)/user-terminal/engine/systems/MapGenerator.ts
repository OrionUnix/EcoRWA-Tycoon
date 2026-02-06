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
        // Normalisation entre 0 et 1
        return (value + 1) * 0.5;
    }

    static generate(engine: MapEngine) {
        console.log("🌱 MapGenerator: Démarrage de la génération...");

        // 1. Initialisation des bruits (Seed aléatoire)
        const seed = Math.random();
        const terrainNoise = createNoise2D(() => seed);     // Pour l'altitude
        const moistureNoise = createNoise2D(() => seed + 1); // Pour l'humidité
        const resNoise = createNoise2D(() => seed + 2);      // Pour les ressources

        // 2. Récupération des tableaux de données
        // On s'assure qu'ils sont vides avant de commencer
        engine.biomes.fill(0);
        engine.heightMap.fill(0);

        const waterLayer = engine.getLayer(LayerType.WATER);
        const terrainLayer = engine.getLayer(LayerType.TERRAIN);
        const resLayer = engine.getLayer(LayerType.RESOURCES);

        waterLayer.fill(0);
        terrainLayer.fill(0);
        resLayer.fill(0);

        // Reset des maps de ressources spécifiques
        Object.values(engine.resourceMaps).forEach(map => map.fill(0));

        // 3. Boucle principale : On parcourt chaque case de la grille
        const scale = 0.03; // Zoom du bruit (plus petit = plus gros continents)
        const offsetX = Math.random() * 1000;
        const offsetY = Math.random() * 1000;

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;

                // Coordonnées pour le bruit
                const nx = (x + offsetX) * scale;
                const ny = (y + offsetY) * scale;

                // --- GÉNÉRATION TERRAIN ---
                const h = this.fbm(nx, ny, 4, terrainNoise); // Hauteur (0 à 1)
                const m = this.fbm(nx, ny, 2, moistureNoise); // Humidité (0 à 1)

                // Stockage des données brutes
                engine.heightMap[i] = h;
                engine.moistureMap[i] = m;
                terrainLayer[i] = h; // Important pour le shader/renderer

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
                    // Terre ferme : dépend de l'humidité
                    if (m < 0.3) biome = BiomeType.DESERT;
                    else if (m > 0.6) biome = BiomeType.FOREST;
                    else biome = BiomeType.PLAINS;
                }

                engine.biomes[i] = biome;

                // --- GÉNÉRATION RESSOURCES ---
                const rule = BIOME_SIGNATURES[biome] || BIOME_SIGNATURES[BiomeType.PLAINS];

                // Helper pour placer une ressource
                const applyRes = (targetMap: Float32Array, r: ResourceRule, noiseOffset: number) => {
                    if (r.chance <= 0) return;
                    // Bruit spécifique à la ressource
                    const n = resNoise(nx + noiseOffset, ny + noiseOffset);
                    // Seuil d'apparition
                    if (n > (1 - r.chance * 2.5)) {
                        const amount = r.intensity * Math.abs(n);
                        targetMap[i] = amount;
                        resLayer[i] = Math.max(resLayer[i], amount); // Le layer global prend la valeur max
                    }
                };

                applyRes(engine.resourceMaps.oil, rule.oil, 10);
                applyRes(engine.resourceMaps.coal, rule.coal, 20);
                applyRes(engine.resourceMaps.iron, rule.iron, 30);
                applyRes(engine.resourceMaps.wood, rule.wood, 40);
                applyRes(engine.resourceMaps.animals, rule.animals, 50);
                applyRes(engine.resourceMaps.fish, rule.fish, 60);
            }
        }

        // 4. Calcul du résumé (pour les jauges UI)
        engine.calculateSummary();

        // 5. Incrémenter la révision pour forcer le Renderer à redessiner
        engine.revision++;
        console.log("✅ MapGenerator: Génération terminée. Revision:", engine.revision);
    }
}