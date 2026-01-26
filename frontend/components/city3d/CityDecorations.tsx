'use client';

/**
 * Décorations de la ville
 * Arbres, parcs, éléments décoratifs globaux
 */

import { useMemo } from 'react';
import GLBModel from './GLBModel';
import { SUBURBAN_MODELS, ROAD_MODELS } from '@/lib/city3d/modelUtils';

interface DecorationItem {
    id: string;
    path: string;
    position: [number, number, number];
    rotation?: number;
    scale?: number;
}

// Décorations globales de la ville
const CITY_DECORATIONS: DecorationItem[] = [
    // Arbres le long des routes principales
    { id: 'global-tree-1', path: SUBURBAN_MODELS['tree-large'], position: [-3, 0, -3], scale: 0.9 },
    { id: 'global-tree-2', path: SUBURBAN_MODELS['tree-small'], position: [5, 0, -3], scale: 0.7 },
    { id: 'global-tree-3', path: SUBURBAN_MODELS['tree-large'], position: [-3, 0, 5], scale: 0.85 },
    { id: 'global-tree-4', path: SUBURBAN_MODELS['tree-small'], position: [5, 0, 5], scale: 0.65 },

    // Parc central
    { id: 'park-tree-1', path: SUBURBAN_MODELS['tree-large'], position: [1, 0, 1], scale: 1.0 },
    { id: 'park-tree-2', path: SUBURBAN_MODELS['tree-small'], position: [0, 0, 0.5], scale: 0.6 },
    { id: 'park-tree-3', path: SUBURBAN_MODELS['tree-small'], position: [2, 0, 0.5], scale: 0.5 },
    { id: 'park-planter-1', path: SUBURBAN_MODELS['planter'], position: [1, 0, -0.5], scale: 0.5 },

    // Lampadaires additionnels
    { id: 'extra-light-1', path: ROAD_MODELS['light-curved'], position: [-6, 0, 0], scale: 0.7 },
    { id: 'extra-light-2', path: ROAD_MODELS['light-curved'], position: [8, 0, 0], scale: 0.7, rotation: Math.PI },
];

interface CityDecorationsProps {
    position?: [number, number, number];
}

export default function CityDecorations({
    position = [0, 0, 0],
}: CityDecorationsProps) {

    const decorations = useMemo(() => CITY_DECORATIONS, []);

    return (
        <group position={position}>
            {decorations.map((deco) => (
                <GLBModel
                    key={deco.id}
                    path={deco.path}
                    position={deco.position}
                    rotation={[0, deco.rotation || 0, 0]}
                    scale={deco.scale || 1}
                />
            ))}
        </group>
    );
}
