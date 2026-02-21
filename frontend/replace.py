import sys
import codecs

try:
    with codecs.open('app/[locale]/(user)/user-terminal/engine/systems/MapGenerator.ts', 'r', 'utf-8') as f:
        content = f.read()

    start = content.find('    // 🛣️ ALGORITHME DE L\'AUTOROUTE RÉGIONALE')
    if start == -1:
        print("Signature de l'algorithme introuvable.")
        sys.exit(1)

    end = content.find('}\r\n}', start)
    if end == -1:
        end = content.find('}\n}', start)
    if end == -1:
        print("Fin de classe introuvable.")
        sys.exit(1)

    new_body = """    // 🛣️ ALGORITHME DE L'AUTOROUTE RÉGIONALE (Mission 4 - Autoroute dynamique)
    private static generateHighway(engine: MapEngine, rng: () => number) {
        let validPlacementFound = false;
        let attempts = 0;
        const maxAttempts = 50;

        while (!validPlacementFound && attempts < maxAttempts) {
            attempts++;

            const edge = Math.floor(rng() * 4);
            let startX = 0, startY = 0, dx = 0, dy = 0;

            if (edge === 0) {
                startX = Math.floor(rng() * (GRID_SIZE - 2)) + 1; startY = 0; dx = 0; dy = 1;
            } else if (edge === 1) {
                startX = Math.floor(rng() * (GRID_SIZE - 2)) + 1; startY = GRID_SIZE - 1; dx = 0; dy = -1;
            } else if (edge === 2) {
                startX = 0; startY = Math.floor(rng() * (GRID_SIZE - 2)) + 1; dx = 1; dy = 0;
            } else {
                startX = GRID_SIZE - 1; startY = Math.floor(rng() * (GRID_SIZE - 2)) + 1; dx = -1; dy = 0;
            }

            const currentPath: {x: number, y: number}[] = [];
            let unlockedCount = 0;
            let cx = startX;
            let cy = startY;
            let pathIsValid = true;

            while (cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) {
                const idx = cy * GRID_SIZE + cx;
                
                if (engine.biomes[idx] === BiomeType.OCEAN || engine.biomes[idx] === BiomeType.DEEP_OCEAN || engine.getLayer(LayerType.WATER)[idx] > 0) {
                    pathIsValid = false;
                    break;
                }

                currentPath.push({x: cx, y: cy});

                if (ChunkManager.isTileUnlocked(cx, cy)) {
                    unlockedCount++;
                }

                if (unlockedCount >= 3) {
                    break;
                }

                cx += dx;
                cy += dy;
            }

            if (pathIsValid && unlockedCount >= 3) {
                validPlacementFound = true;
                const placedIndices: number[] = [];

                for (const pos of currentPath) {
                    const idx = pos.y * GRID_SIZE + pos.x;
                    
                    engine.roadLayer[idx] = {
                        type: RoadType.HIGHWAY,
                        speedLimit: 3.0,
                        lanes: 6,
                        isTunnel: false,
                        isBridge: false,
                        connections: { n: false, s: false, e: false, w: false }
                    };

                    if (engine.resourceMaps.wood) engine.resourceMaps.wood[idx] = 0;
                    if (engine.resourceMaps.stone) engine.resourceMaps.stone[idx] = 0;
                    if (engine.resourceMaps.animals) engine.resourceMaps.animals[idx] = 0;

                    placedIndices.push(idx);
                }

                placedIndices.forEach(idx => {
                    RoadManager.updateConnections(engine, idx);
                });

                console.log(`🛣️ Autoroute régionale (Trafic Actif) générée (bord:${edge}), longueur: ${currentPath.length}`);
            }
        }

        if (!validPlacementFound) {
            console.warn("⚠️ Impossible de trouver un emplacement sans eau pour l'autoroute régionale.");
        }
    }
}
"""
    content = content[:start] + new_body + content[end+3:]
    with codecs.open('app/[locale]/(user)/user-terminal/engine/systems/MapGenerator.ts', 'w', 'utf-8') as f:
        f.write(content)
    print("Mise a jour terminee!")
except Exception as e:
    print(f"Erreur: {e}")
