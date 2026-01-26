'use client';

/**
 * Zone Industrielle
 * Usines, entrepôts, logistique
 */

import { useMemo } from 'react';
import GLBModel from '../GLBModel';
import { INDUSTRIAL_MODELS } from '@/lib/city3d/modelUtils';
import type { ZoneProps, Building3D } from '@/types/cityTypes';

// Configuration des bâtiments industriels
const INDUSTRIAL_BUILDINGS: Building3D[] = [
    {
        id: 'ind-1',
        name: "L'Entrepôt Global",
        type: { fr: 'Logistique', en: 'Logistics' },
        typeColor: 'slate',
        zone: 'industrial',
        position: { x: 0, y: 0, z: 0 },
        model: { path: INDUSTRIAL_MODELS['warehouse-a'], scale: 0.9 },
        yield: '11.5%',
        price: '550 USDC',
        pluAlert: {
            fr: 'Zone industrielle. Accès poids lourds 24/7.',
            en: 'Industrial zone. 24/7 heavy truck access.'
        },
        isMintable: false,
    },
    {
        id: 'ind-2',
        name: 'Usine Tech',
        type: { fr: 'Industriel', en: 'Industrial' },
        typeColor: 'slate',
        zone: 'industrial',
        position: { x: 4, y: 0, z: 0 },
        model: { path: INDUSTRIAL_MODELS['factory-a'], scale: 0.85 },
    },
    {
        id: 'ind-3',
        name: 'Centre Logistique',
        type: { fr: 'Logistique', en: 'Logistics' },
        typeColor: 'slate',
        zone: 'industrial',
        position: { x: 0, y: 0, z: 4 },
        model: { path: INDUSTRIAL_MODELS['factory-b'], scale: 0.8 },
    },
    {
        id: 'ind-4',
        name: 'Hangar Nord',
        type: { fr: 'Industriel', en: 'Industrial' },
        typeColor: 'slate',
        zone: 'industrial',
        position: { x: 4, y: 0, z: 4 },
        model: { path: INDUSTRIAL_MODELS['warehouse-b'], scale: 0.75 },
    },
    {
        id: 'ind-5',
        name: 'La Serre Urbaine',
        type: { fr: 'Agricole', en: 'Agricultural' },
        typeColor: 'teal',
        zone: 'industrial',
        position: { x: 8, y: 0, z: 0 },
        model: { path: INDUSTRIAL_MODELS['factory-c'], scale: 0.7 },
        yield: '3.5%',
        price: '120 USDC',
        isMintable: false,
    },
];

// Détails industriels (cheminées, réservoirs)
const INDUSTRIAL_DETAILS = [
    { id: 'chimney-1', path: INDUSTRIAL_MODELS['chimney-large'], position: [1, 0, 0.5] as [number, number, number], scale: 0.6 },
    { id: 'chimney-2', path: INDUSTRIAL_MODELS['chimney-medium'], position: [5, 0, 0.5] as [number, number, number], scale: 0.5 },
    { id: 'tank-1', path: INDUSTRIAL_MODELS['tank'], position: [2.5, 0, 6] as [number, number, number], scale: 0.7 },
];

interface IndustrialZoneProps extends ZoneProps {
    selectedBuildingId?: string | null;
}

export default function IndustrialZone({
    position = [0, 0, 0],
    onBuildingClick,
    selectedBuildingId,
}: IndustrialZoneProps) {

    const buildings = useMemo(() => INDUSTRIAL_BUILDINGS, []);
    const details = useMemo(() => INDUSTRIAL_DETAILS, []);

    return (
        <group position={position}>
            {/* Bâtiments industriels */}
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

            {/* Détails industriels */}
            {details.map((detail) => (
                <GLBModel
                    key={detail.id}
                    path={detail.path}
                    position={detail.position}
                    scale={detail.scale}
                />
            ))}
        </group>
    );
}

// Export des données pour l'info panel
export { INDUSTRIAL_BUILDINGS };
