'use client';

/**
 * Zone Résidentielle (Suburban)
 * Maisons, pavillons, arbres et clôtures
 */

import { useMemo } from 'react';
import GLBModel from '../GLBModel';
import { SUBURBAN_MODELS } from '@/lib/city3d/modelUtils';
import type { ZoneProps, Building3D } from '@/types/cityTypes';

// Configuration des bâtiments résidentiels
const RESIDENTIAL_BUILDINGS: Building3D[] = [
    {
        id: 'res-1',
        name: 'Loft Saint-Germain',
        type: { fr: 'Résidentiel', en: 'Residential' },
        typeColor: 'blue',
        zone: 'residential',
        position: { x: 0, y: 0, z: 0 },
        model: { path: SUBURBAN_MODELS['house-a'], scale: 1 },
        yield: '4.2%',
        price: '150 USDC',
        pluAlert: {
            fr: 'Zone protégée, travaux interdits. Stabilité maximale.',
            en: 'Protected zone, no construction allowed. Max stability.'
        },
        isMintable: true,
    },
    {
        id: 'res-2',
        name: 'Résidence Pixel',
        type: { fr: 'Résidentiel', en: 'Residential' },
        typeColor: 'blue',
        zone: 'residential',
        position: { x: 2.5, y: 0, z: 0 },
        model: { path: SUBURBAN_MODELS['house-b'], scale: 1 },
        yield: '5.1%',
        price: '180 USDC',
        isMintable: false,
    },
    {
        id: 'res-3',
        name: 'Villa Moderne',
        type: { fr: 'Résidentiel', en: 'Residential' },
        typeColor: 'blue',
        zone: 'residential',
        position: { x: 5, y: 0, z: 0 },
        model: { path: SUBURBAN_MODELS['house-c'], scale: 1 },
    },
    {
        id: 'res-4',
        name: 'Maison Jardin',
        type: { fr: 'Résidentiel', en: 'Residential' },
        typeColor: 'blue',
        zone: 'residential',
        position: { x: 0, y: 0, z: 2.5 },
        model: { path: SUBURBAN_MODELS['house-d'], scale: 1 },
    },
    {
        id: 'res-5',
        name: 'Pavillon Soleil',
        type: { fr: 'Résidentiel', en: 'Residential' },
        typeColor: 'blue',
        zone: 'residential',
        position: { x: 2.5, y: 0, z: 2.5 },
        model: { path: SUBURBAN_MODELS['house-e'], scale: 1 },
    },
    {
        id: 'res-6',
        name: 'Cottage Vert',
        type: { fr: 'Résidentiel', en: 'Residential' },
        typeColor: 'blue',
        zone: 'residential',
        position: { x: 5, y: 0, z: 2.5 },
        model: { path: SUBURBAN_MODELS['house-f'], scale: 1 },
    },
    {
        id: 'res-7',
        name: 'Chalet Urbain',
        type: { fr: 'Résidentiel', en: 'Residential' },
        typeColor: 'blue',
        zone: 'residential',
        position: { x: 0, y: 0, z: 5 },
        model: { path: SUBURBAN_MODELS['house-g'], scale: 1 },
    },
    {
        id: 'res-8',
        name: 'Studio Compact',
        type: { fr: 'Résidentiel', en: 'Residential' },
        typeColor: 'blue',
        zone: 'residential',
        position: { x: 2.5, y: 0, z: 5 },
        model: { path: SUBURBAN_MODELS['house-h'], scale: 1 },
    },
];

// Décorations (arbres, clôtures)
const RESIDENTIAL_DECORATIONS = [
    { id: 'tree-1', path: SUBURBAN_MODELS['tree-large'], position: [1.2, 0, 1.2] as [number, number, number], scale: 0.8 },
    { id: 'tree-2', path: SUBURBAN_MODELS['tree-small'], position: [3.7, 0, 1.2] as [number, number, number], scale: 0.6 },
    { id: 'tree-3', path: SUBURBAN_MODELS['tree-large'], position: [6.2, 0, 3.7] as [number, number, number], scale: 0.7 },
    { id: 'tree-4', path: SUBURBAN_MODELS['tree-small'], position: [1.2, 0, 6.2] as [number, number, number], scale: 0.5 },
    { id: 'planter-1', path: SUBURBAN_MODELS['planter'], position: [4, 0, 6] as [number, number, number], scale: 0.5 },
];

interface ResidentialZoneProps extends ZoneProps {
    selectedBuildingId?: string | null;
}

export default function ResidentialZone({
    position = [0, 0, 0],
    onBuildingClick,
    selectedBuildingId,
}: ResidentialZoneProps) {

    const buildings = useMemo(() => RESIDENTIAL_BUILDINGS, []);
    const decorations = useMemo(() => RESIDENTIAL_DECORATIONS, []);

    return (
        <group position={position}>
            {/* Bâtiments */}
            {buildings.map((building) => (
                <GLBModel
                    key={building.id}
                    path={building.model.path}
                    position={[
                        building.position.x,
                        building.position.y,
                        building.position.z,
                    ]}
                    scale={building.model.scale || 1}
                    onClick={() => onBuildingClick?.(building)}
                    isSelected={selectedBuildingId === building.id}
                />
            ))}

            {/* Décorations (non-cliquables) */}
            {decorations.map((deco) => (
                <GLBModel
                    key={deco.id}
                    path={deco.path}
                    position={deco.position}
                    scale={deco.scale}
                />
            ))}
        </group>
    );
}

// Export des données pour l'info panel
export { RESIDENTIAL_BUILDINGS };
