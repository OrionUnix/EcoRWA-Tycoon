'use client';

/**
 * Réseau de Routes 3D
 * Gère les routes qui connectent les différentes zones
 */

import { useMemo } from 'react';
import GLBModel from './GLBModel';
import { ROAD_MODELS } from '@/lib/city3d/modelUtils';

interface RoadSegment {
    id: string;
    type: keyof typeof ROAD_MODELS;
    position: [number, number, number];
    rotation?: number; // Rotation Y en radians
}

// 1. Configuration des segments (Ajustée pour boucher les trous)
const ROAD_NETWORK: RoadSegment[] = [
    // Axe horizontal principal (Z = -2)
    { id: 'h1', type: 'straight', position: [-8, 0, -2], rotation: Math.PI / 2 },
    { id: 'h2', type: 'straight', position: [-6, 0, -2], rotation: Math.PI / 2 },
    { id: 'h3', type: 'straight', position: [-4, 0, -2], rotation: Math.PI / 2 },
    { id: 'h4', type: 'intersection', position: [-2, 0, -2], rotation: Math.PI / 2 },
    { id: 'h5', type: 'straight', position: [0, 0, -2], rotation: Math.PI / 2 },
    { id: 'h6', type: 'straight', position: [2, 0, -2], rotation: Math.PI / 2 },
    { id: 'h7', type: 'intersection', position: [4, 0, -2], rotation: -Math.PI / 2 },
    { id: 'h8', type: 'straight', position: [6, 0, -2], rotation: Math.PI / 2 },
    { id: 'h9', type: 'straight', position: [8, 0, -2], rotation: Math.PI / 2 },

    // Axe vertical gauche (X = -2)
    { id: 'v1', type: 'straight', position: [-2, 0, -8] },
    { id: 'v2', type: 'straight', position: [-2, 0, -6] },
    { id: 'v3', type: 'straight', position: [-2, 0, -4] },
    { id: 'v4', type: 'straight', position: [-2, 0, 0] },
    { id: 'v5', type: 'straight', position: [-2, 0, 2] },
    { id: 'v6', type: 'intersection', position: [-2, 0, 4], rotation: Math.PI },

    // Axe vertical droit (X = 4)
    { id: 'v7', type: 'straight', position: [4, 0, -8] },
    { id: 'v8', type: 'straight', position: [4, 0, -6] },
    { id: 'v9', type: 'straight', position: [4, 0, -4] },
    { id: 'v10', type: 'straight', position: [4, 0, 0] },
    { id: 'v11', type: 'straight', position: [4, 0, 2] },
    { id: 'v12', type: 'intersection', position: [4, 0, 4], rotation: Math.PI },

    // Connexion basse (Z = 4)
    { id: 'h10', type: 'straight', position: [0, 0, 4], rotation: Math.PI / 2 },
    { id: 'h11', type: 'straight', position: [2, 0, 4], rotation: Math.PI / 2 },

    // Terminaisons
    { id: 'end1', type: 'end-round', position: [-10, 0, -2], rotation: Math.PI / 2 },
    { id: 'end2', type: 'end-round', position: [10, 0, -2], rotation: -Math.PI / 2 },
];

// 2. Définition de l'éclairage (C'est ce qui manquait !)
const STREET_LIGHTS = [
    { id: 'light-1', position: [-2.5, 0, -3.5] as [number, number, number] },
    { id: 'light-2', position: [4.5, 0, -3.5] as [number, number, number] },
    { id: 'light-3', position: [-2.5, 0, 1.5] as [number, number, number] },
    { id: 'light-4', position: [4.5, 0, 1.5] as [number, number, number] },
    { id: 'light-5', position: [1, 0, -2.5] as [number, number, number] },
    { id: 'light-6', position: [1, 0, 4.5] as [number, number, number] },
];

interface RoadNetworkProps {
    position?: [number, number, number];
    showLights?: boolean;
}

export default function RoadNetwork({
    position = [0, 0, 0],
    showLights = true,
}: RoadNetworkProps) {

    const roads = useMemo(() => ROAD_NETWORK, []);
    const lights = useMemo(() => STREET_LIGHTS, []);

    return (
        <group position={position}>
            {/* Segments de route */}
            {roads.map((segment) => (
                <GLBModel
                    key={segment.id}
                    path={ROAD_MODELS[segment.type] || ROAD_MODELS['straight']}
                    position={segment.position}
                    rotation={[0, segment.rotation || 0, 0]}
                    scale={1}
                />
            ))}

            {/* Éclairage urbain */}
            {showLights && lights.map((light) => (
                <GLBModel
                    key={light.id}
                    path={ROAD_MODELS['light-square']}
                    position={light.position}
                    scale={0.8}
                />
            ))}
        </group>
    );
}