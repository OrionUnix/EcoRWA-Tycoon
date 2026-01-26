'use client';

/**
 * VERSION SIMPLE - GRILLE DE BASE
 * Génère une grille uniforme sur toute la carte
 */

import { useMemo } from 'react';
import GLBModel from './GLBModel';
import { ROAD_MODELS } from '@/lib/city3d/modelUtils';

interface RoadNetworkProps {
    position?: [number, number, number];
    gridSize?: number;
    blockSize?: number;
    showDebug?: boolean;
}

export default function RoadNetwork({
    position = [0, 0, 0],
    gridSize = 30,      // Taille de la grille (30x30)
    blockSize = 4,      // Une route tous les 4 unités
    showDebug = false,
}: RoadNetworkProps) {

    const roadElements = useMemo(() => {
        const elements: any[] = [];
        const cellSize = 2; // Taille d'une cellule

        console.log('🛣️ Génération grille simple');
        console.log(`Taille: ${gridSize}x${gridSize}, Espacement: ${blockSize}`);

        const halfGrid = gridSize / 2;
        const minCoord = -halfGrid;
        const maxCoord = halfGrid;

        // Fonction pour ajouter une route
        const addRoad = (id: string, modelKey: string, pos: [number, number, number], rot: number = 0) => {
            const path = (ROAD_MODELS as any)[modelKey];
            if (path) {
                elements.push({ id, path, pos, rot, scale: 1 });
            } else {
                console.warn(`Modèle manquant: ${modelKey}`);
            }
        };

        // ROUTES HORIZONTALES (tous les blockSize)
        for (let z = minCoord; z <= maxCoord; z += blockSize) {
            for (let x = minCoord; x <= maxCoord; x += cellSize) {
                // Vérifier si c'est une intersection
                const isIntersection = (x % blockSize === 0);

                if (isIntersection) {
                    addRoad(`cross-${x}-${z}`, 'crossroad-path', [x, 0, z], 0);
                } else {
                    addRoad(`h-${x}-${z}`, 'straight', [x, 0, z], Math.PI / 2);
                }
            }
        }

        // ROUTES VERTICALES (tous les blockSize)
        for (let x = minCoord; x <= maxCoord; x += blockSize) {
            for (let z = minCoord; z <= maxCoord; z += cellSize) {
                // Skip si déjà placé comme intersection
                if (z % blockSize === 0) continue;

                addRoad(`v-${x}-${z}`, 'straight', [x, 0, z], 0);
            }
        }

        console.log(`✅ ${elements.length} segments générés`);
        return elements;
    }, [gridSize, blockSize]);

    return (
        <group position={position}>
            {/* ROUTES */}
            {roadElements.map((el) => (
                <GLBModel
                    key={el.id}
                    path={el.path}
                    position={el.pos}
                    rotation={[0, el.rot, 0]}
                    scale={el.scale}
                />
            ))}

            {/* GRILLE DE DEBUG (optionnelle) */}
            {showDebug && (
                <gridHelper
                    args={[gridSize * 2, gridSize, 0x444444, 0x222222]}
                    position={[0, 0.01, 0]}
                />
            )}
        </group>
    );
}