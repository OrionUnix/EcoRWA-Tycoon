import { createNoise2D } from 'simplex-noise';
import { MapEngine } from '../MapEngine';
import { GRID_SIZE } from '../config';
import { LayerType, BiomeType, RoadType } from '../types';
import { BIOME_SIGNATURES, ResourceRule } from '../data/biomeData';
import { RoadManager } from '../RoadManager';
import { ChunkManager } from '../ChunkManager';
import { SeededRandom, ResourceSalt } from '../SeededRandom';

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

    static generate(engine: MapEngine, walletAddress?: string) {
        console.log("🌱 MapGenerator: Démarrage de la génération...");

        // 🔑 GARANTIE DU SEED: On utilise engine.mapSeed si présent,
        // sinon on utilise wallet pour la première fois, sinon un UUID stable.
        // ⚠️ Math.random() est INTERDIT ici — la seed doit TOUJOURS être déterministe.
        if (!engine.mapSeed) {
            if (walletAddress) {
                engine.mapSeed = walletAddress;
                console.log(`✨ Seed depuis wallet : ${engine.mapSeed}`);
            } else {
                // Fallback sans wallet : seed basée sur timestamp (fixée une seule fois)
                // Elle sera remplacée dès que le wallet se connecte et charge la sauvegarde.
                engine.mapSeed = `default_${Date.now().toString(36)}`;
                console.warn(`⚠️ Aucune seed fournie — seed temporaire : ${engine.mapSeed}`);
            }
        }

        // 🎯 DOUBLE RNG :
        // - seqRng : Sequential (pour initier les fonctions createNoise2D — usage unique)
        // - tileRng : Per-tile hash (sans état, 100% déterministe par coordonnée)
        const seededRandom = new SeededRandom(engine.mapSeed);
        const seqRng = seededRandom.createSequentialRng();
        const tileRng = seededRandom; // Alias sémantique
        console.log(`🎲 World Seed: ${engine.mapSeed}`);

        // Création des générateurs de bruit (Perlin/Simplex)
        // createNoise2D est initié UNE seule fois avec seqRng.
        const terrainNoise = createNoise2D(seqRng);
        const moistureNoise = createNoise2D(seqRng);
        const riverNoise = createNoise2D(seqRng);
        const resNoise = createNoise2D(seqRng);
        const undergroundNoise = createNoise2D(seqRng); // ✅ Bruit pour l'eau souterraine

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

        // ✅ OFFSETS : utilisent seqRng (appelé UNE SEULE FOIS avant la boucle tuile)
        // Ces offsets sont constants pour une seed donnée.
        const offsetX = seqRng() * 10000;
        const offsetY = seqRng() * 10000;

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

                // ✅ FIX CORE : applyRes est maintenant SANS ÉTAT.
                // Le salt garantit un espace de valeurs isolé pour chaque ressource.
                // tileRng.at(x, y, salt) retourne TOUJOURS la même valeur pour (seed, x, y, salt).
                const applyRes = (targetMap: Float32Array | undefined, r: ResourceRule | undefined, noiseOffset: number, salt: number) => {
                    if (!targetMap || !r || r.chance <= 0) return;
                    if (r.minHeight && h < r.minHeight) return;
                    if (r.maxHeight && h > r.maxHeight) return;

                    // 1. Présence de la ressource : décidée par le bruit de Perlin (déterministe par (x,y))
                    const n = resNoise(x * 0.1 + noiseOffset, y * 0.1 + noiseOffset);
                    if (n > (1 - r.chance)) {
                        // 2. Variation d'intensité : ✅ hash par coordonnées (SANS ÉTAT)
                        //    tileRng.at() ne dépend pas de l'ordre d'exécution.
                        const variation = 0.8 + tileRng.at(x, y, salt) * 0.4; // ±20%
                        targetMap[i] = r.intensity * variation;
                    }
                };

                // ✅ Chaque ressource passe son salt unique depuis ResourceSalt
                applyRes(engine.resourceMaps.oil, rule.oil, 0, ResourceSalt.OIL);
                applyRes(engine.resourceMaps.coal, rule.coal, 100, ResourceSalt.COAL);
                applyRes(engine.resourceMaps.iron, rule.iron, 200, ResourceSalt.IRON);
                applyRes(engine.resourceMaps.wood, rule.wood, 300, ResourceSalt.WOOD);
                applyRes(engine.resourceMaps.animals, rule.animals, 400, ResourceSalt.ANIMALS);
                applyRes(engine.resourceMaps.fish, rule.fish, 500, ResourceSalt.FISH);

                applyRes(engine.resourceMaps.gold, rule.gold, 600, ResourceSalt.GOLD);
                applyRes(engine.resourceMaps.silver, rule.silver, 700, ResourceSalt.SILVER);
                applyRes(engine.resourceMaps.stone, rule.stone, 800, ResourceSalt.STONE);

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
        // Les rivières utilisent seqRng car leur algorithme est un Random Walk séquentiel
        // (chaque pas dépend du précédent). Le résultat global reste déterministe
        // car seqRng a été initialisé avec la même seed, dans le même ordre d'appels.
        this.generateRivers(engine, seqRng, 2);
        // 5. ✅ GÉNÉRATION DES PLAGES DE FAÇON COHÉRENTE
        this.generateBeaches(engine);
        // 6. ✅ GÉNÉRATION DE L'AUTOROUTE RÉGIONALE
        this.generateHighway(engine, seqRng);
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

                engine.biomes[index] = BiomeType.OCEAN;
                engine.getLayer(LayerType.WATER)[index] = 0.6;

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