import { createNoise2D } from 'simplex-noise';
import { MapEngine } from '../MapEngine';
import { GRID_SIZE } from '../config';
import { LayerType, BiomeType, RoadType } from '../types';
import { BIOME_SIGNATURES, ResourceRule } from '../data/biomeData';
import { RoadManager } from '../RoadManager';
import { ChunkManager } from '../ChunkManager';

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

        // 🔑 GARANTIE DU SEED: On utilise engine.mapSeed si présent, 
        // sinon on utilise wallet pour la première fois, sinon du random.
        if (!engine.mapSeed) {
            engine.mapSeed = walletAddress || Math.random().toString(36).substring(7);
            console.log(`✨ Nouvelle graine générée : ${engine.mapSeed}`);
        }

        const rng = this.createSeededRandom(engine.mapSeed);
        console.log(`🎲 World Seed: ${engine.mapSeed}`);

        // Création des générateurs de bruit
        // createNoise2D attend une fonction () => number. rng est compatible.
        const terrainNoise = createNoise2D(rng);
        const moistureNoise = createNoise2D(rng);
        const riverNoise = createNoise2D(rng);
        const resNoise = createNoise2D(rng); // Not used explicitly but good practice
        const undergroundNoise = createNoise2D(rng); // ✅ Bruit pour l'eau souterraine

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
                // Le bruit d'humidité (pour déserts et forêts) est 10x plus grand (plus lissé)
                const nx_m = (x + offsetX) * 0.02;
                const ny_m = (y + offsetY) * 0.02;
                const m = this.fbm(nx_m, ny_m, 2, moistureNoise);

                engine.heightMap[i] = h;
                engine.moistureMap[i] = m;
                terrainLayer[i] = h;

                // --- DÉCISION BIOME (RADICALE) ---
                let biome: BiomeType = BiomeType.PLAINS;

                // ✅ La plage n'est plus aléatoire par hauteur, elle entoure l'eau
                if (h > 0.85) {
                    biome = BiomeType.MOUNTAIN;
                }
                else {
                    if (m < 0.20) biome = BiomeType.DESERT;
                    else if (m > 0.50) biome = BiomeType.FOREST;
                    else biome = BiomeType.PLAINS;
                }

                engine.biomes[i] = biome;

                // --- GÉNÉRATION RESSOURCES ---
                const rule = BIOME_SIGNATURES[biome] || BIOME_SIGNATURES[BiomeType.PLAINS];

                const applyRes = (targetMap: Float32Array | undefined, r: ResourceRule | undefined, noiseOffset: number, resourceType?: string) => {
                    if (!targetMap || !r || r.chance <= 0) return;
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

                // ✅ NAPPES PHRÉATIQUES INDÉPENDANTES (Eau Souterraine)
                // Échelle plus douce (0.025) et grand offset (+1000) pour détacher totalement le bruit de la surface
                const nx_u = (x + offsetX) * 0.025 + 1000;
                const ny_u = (y + offsetY) * 0.025 + 1000;
                let uVal = this.fbm(nx_u, ny_u, 3, undergroundNoise);

                // Seule la valeur du bruit détermine s'il y a de l'eau (poches massives, indépendamment du biome)
                if (uVal < 0.6) {
                    uVal = 0;
                } else {
                    uVal = (uVal - 0.6) * 2.5; // Normalisation 0-1
                }
                engine.resourceMaps.undergroundWater[i] = uVal;
            }
        }

        // --- POST-PROCESSING ---
        // 4. ✅ GÉNÉRATION DES RIVIÈRES CONTINUES (Random Walk)
        this.generateRivers(engine, rng, 2); // Génère 2 rivières principales
        // 5. ✅ GÉNÉRATION DES PLAGES DE FAÇON COHÉRENTE
        this.generateBeaches(engine);
        // 6. ✅ GÉNÉRATION DE L'AUTOROUTE RÉGIONALE (M2 & M3)
        this.generateHighway(engine, rng);
    }

    // 🌊 ALGORITHME DES RIVAGES (Plages)
    private static generateBeaches(engine: MapEngine) {
        // Créer une copie originelle des biomes pour ne pas propager le sable à l'infini
        const originalBiomes = new Int32Array(engine.biomes);

        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const i = y * GRID_SIZE + x;

                // Si la case n'est PAS de l'eau
                if (originalBiomes[i] !== BiomeType.OCEAN && originalBiomes[i] !== BiomeType.DEEP_OCEAN) {
                    let hasWaterNeighbor = false;

                    // Vérifie les 4 voisins (Haut, Bas, Gauche, Droite)
                    const neighbors = [
                        [0, -1], [0, 1], [-1, 0], [1, 0]
                    ];

                    for (const [dx, dy] of neighbors) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                            const ni = ny * GRID_SIZE + nx;
                            if (originalBiomes[ni] === BiomeType.OCEAN || originalBiomes[ni] === BiomeType.DEEP_OCEAN) {
                                hasWaterNeighbor = true;
                                break;
                            }
                        }
                    }

                    // On transforme le bord en Plage/Sable
                    if (hasWaterNeighbor && originalBiomes[i] !== BiomeType.MOUNTAIN) {
                        engine.biomes[i] = BiomeType.BEACH;
                        // Enlève la forêt ou bâtiments potentiels de la plage
                        if (engine.resourceMaps.wood) engine.resourceMaps.wood[i] = 0;
                    }
                }
            }
        }
    }

    // 🌊 ALGORITHME DE RIVIÈRE CONTINUE
    private static generateRivers(engine: MapEngine, rng: () => number, riverCount: number = 1) {
        const width = GRID_SIZE;
        const height = GRID_SIZE;

        for (let r = 0; r < riverCount; r++) {
            // La rivière commence sur le bord gauche (x = 0) à une hauteur aléatoire
            let x = 0;
            let y = Math.floor(rng() * height);

            // La rivière avance jusqu'à toucher le bord droit
            while (x < width && y >= 0 && y < height) {
                const index = y * width + x;

                // 1. On force le biome en EAU (Ocean/River)
                engine.biomes[index] = BiomeType.OCEAN;
                engine.getLayer(LayerType.WATER)[index] = 0.6;

                // 2. On supprime les ressources générées par erreur sous l'eau (arbres, minerais)
                if (engine.resourceMaps.wood) engine.resourceMaps.wood[index] = 0;
                if (engine.resourceMaps.animals) engine.resourceMaps.animals[index] = 0;
                if (engine.resourceMaps.stone) engine.resourceMaps.stone[index] = 0;

                // 3. Optionnel : On élargit un peu la rivière pour qu'elle fasse 2 cases de large
                if (y + 1 < height) {
                    const indexLarge = (y + 1) * width + x;
                    engine.biomes[indexLarge] = BiomeType.OCEAN;
                    engine.getLayer(LayerType.WATER)[indexLarge] = 0.6;

                    if (engine.resourceMaps.wood) engine.resourceMaps.wood[indexLarge] = 0;
                    if (engine.resourceMaps.animals) engine.resourceMaps.animals[indexLarge] = 0;
                }

                // 4. Marche aléatoire (Random Walk) : Avancer vers la droite avec des virages
                const dir = rng();
                if (dir < 0.5) {
                    x++; // Ligne droite
                } else if (dir < 0.75) {
                    y++; // Virage en bas
                    x++; // On avance quand même pour ne pas tourner en rond
                } else {
                    y--; // Virage en haut
                    x++;
                }
            }
        }
    }

    // 🛣️ ALGORITHME DE L'AUTOROUTE RÉGIONALE (Mission 5 : Inside-Out)
    private static generateHighway(engine: MapEngine, rng: () => number) {
        const placedIndices: number[] = [];

        // 1. Trouver le centre de la carte
        const centerX = Math.floor(GRID_SIZE / 2);
        const centerY = Math.floor(GRID_SIZE / 2);

        // 2. Choisir l'axe de sortie : 0 = Gauche, 1 = Bas
        const exitEdge = Math.floor(rng() * 2);
        let dx = 0;
        let dy = 0;
        let borderX = centerX;
        let borderY = centerY;

        if (exitEdge === 0) {
            // Sortie par la Gauche (vers x = 0)
            dx = -1;
            dy = 0;
            // Trouver le bord gauche de la zone débloquée
            while (ChunkManager.isTileUnlocked(borderX + dx, borderY) && borderX > 0) {
                borderX += dx;
            }
        } else {
            // Sortie par le Bas (vers y = GRID_SIZE - 1)
            dx = 0;
            dy = 1;
            // Trouver le bord bas de la zone débloquée
            while (ChunkManager.isTileUnlocked(borderX, borderY + dy) && borderY < GRID_SIZE - 1) {
                borderY += dy;
            }
        }

        // `borderX, borderY` représente la case la plus au bord (gauche ou bas) de la zone initiale.

        // 3. Pénétrer dans la ville (3 cases vers l'intérieur)
        let inDx = -dx;
        let inDy = -dy;
        for (let i = 0; i < 3; i++) {
            const cx = borderX + (inDx * i);
            const cy = borderY + (inDy * i);
            const idx = cy * GRID_SIZE + cx;

            engine.roadLayer[idx] = {
                type: RoadType.HIGHWAY,
                speedLimit: 3.0,
                lanes: 6,
                isTunnel: false,
                isBridge: false,
                connections: { n: false, s: false, e: false, w: false }
            };

            // On écrase les ressources
            if (engine.resourceMaps.wood) engine.resourceMaps.wood[idx] = 0;
            if (engine.resourceMaps.stone) engine.resourceMaps.stone[idx] = 0;
            if (engine.resourceMaps.animals) engine.resourceMaps.animals[idx] = 0;

            placedIndices.push(idx);
        }

        // 4. Sortir vers le monde (mode Bulldozer total)
        // On commence à placer la route à partir de la case située 1 unité à l'extérieur
        let cx = borderX + dx;
        let cy = borderY + dy;
        while (cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
            const idx = cy * GRID_SIZE + cx;

            // Mode Bulldozer : on écrase tout (l'eau devient traversable par la route)
            engine.roadLayer[idx] = {
                type: RoadType.HIGHWAY,
                speedLimit: 3.0,
                lanes: 6,
                isTunnel: false,
                isBridge: false,
                connections: { n: false, s: false, e: false, w: false }
            };

            // Nettoyage des ressources sur le passage
            if (engine.resourceMaps.wood) engine.resourceMaps.wood[idx] = 0;
            if (engine.resourceMaps.stone) engine.resourceMaps.stone[idx] = 0;
            if (engine.resourceMaps.animals) engine.resourceMaps.animals[idx] = 0;

            placedIndices.push(idx);

            cx += dx;
            cy += dy;
        }

        // 5. Enregistrer pour le trafic instantané
        placedIndices.forEach(idx => {
            RoadManager.updateConnections(engine, idx);
        });

        console.log(`🛣️ Autoroute régionale (Inside-Out) générée (bord: ${exitEdge === 0 ? 'Gauche' : 'Bas'}), longueur totale: ${placedIndices.length} cases`);
    }
}