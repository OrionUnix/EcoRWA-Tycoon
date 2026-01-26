'use client';

/**
 * Zone Commerciale
 * Commerces, boutiques, restaurants
 */

import { useMemo } from 'react';
import GLBModel from '../GLBModel';
import { COMMERCIAL_MODELS } from '@/lib/city3d/modelUtils';
import type { ZoneProps, Building3D } from '@/types/cityTypes';

// Configuration des bâtiments commerciaux
const COMMERCIAL_BUILDINGS: Building3D[] = [
    {
        id: 'com-1',
        name: 'Le Bistrot Central',
        type: { fr: 'Commercial', en: 'Commercial' },
        typeColor: 'orange',
        zone: 'commercial',
        position: { x: 0, y: 0, z: 0 },
        model: { path: COMMERCIAL_MODELS['building-a'], scale: 0.8 },
        yield: '7.8%',
        price: '100 USDC',
        pluAlert: {
            fr: 'Travaux de rue prévus en 2026. Risque de vacance.',
            en: 'Roadworks planned for 2026. Vacancy risk.'
        },
        isMintable: true,
    },
    {
        id: 'com-2',
        name: 'Galerie Marchande',
        type: { fr: 'Commercial', en: 'Commercial' },
        typeColor: 'orange',
        zone: 'commercial',
        position: { x: 3, y: 0, z: 0 },
        model: { path: COMMERCIAL_MODELS['building-b'], scale: 0.9 },
        yield: '8.4%',
        price: '600 USDC',
        isMintable: false,
    },
    {
        id: 'com-3',
        name: 'Centre Mode',
        type: { fr: 'Commercial', en: 'Commercial' },
        typeColor: 'orange',
        zone: 'commercial',
        position: { x: 6, y: 0, z: 0 },
        model: { path: COMMERCIAL_MODELS['building-c'], scale: 0.8 },
    },
    {
        id: 'com-4',
        name: 'Supermarché Fresh',
        type: { fr: 'Commercial', en: 'Commercial' },
        typeColor: 'orange',
        zone: 'commercial',
        position: { x: 0, y: 0, z: 3 },
        model: { path: COMMERCIAL_MODELS['building-d'], scale: 0.85 },
    },
    {
        id: 'com-5',
        name: 'Restaurant Gourmet',
        type: { fr: 'Commercial', en: 'Commercial' },
        typeColor: 'orange',
        zone: 'commercial',
        position: { x: 3, y: 0, z: 3 },
        model: { path: COMMERCIAL_MODELS['building-f'], scale: 0.75 },
    },
    {
        id: 'com-6',
        name: 'Café Terrasse',
        type: { fr: 'Commercial', en: 'Commercial' },
        typeColor: 'orange',
        zone: 'commercial',
        position: { x: 6, y: 0, z: 3 },
        model: { path: COMMERCIAL_MODELS['building-g'], scale: 0.7 },
    },
];

// Détails décoratifs (auvents, parasols)
const COMMERCIAL_DETAILS = [
    { id: 'awning-1', path: COMMERCIAL_MODELS['awning'], position: [0.5, 0.8, 0.5] as [number, number, number], scale: 0.5 },
    { id: 'parasol-1', path: COMMERCIAL_MODELS['parasol-a'], position: [4.5, 0, 4] as [number, number, number], scale: 0.6 },
    { id: 'parasol-2', path: COMMERCIAL_MODELS['parasol-a'], position: [5.5, 0, 4] as [number, number, number], scale: 0.6 },
];

interface CommercialZoneProps extends ZoneProps {
    selectedBuildingId?: string | null;
}

export default function CommercialZone({
    position = [0, 0, 0],
    onBuildingClick,
    selectedBuildingId,
}: CommercialZoneProps) {

    const buildings = useMemo(() => COMMERCIAL_BUILDINGS, []);
    const details = useMemo(() => COMMERCIAL_DETAILS, []);

    return (
        <group position={position}>
            {/* Bâtiments commerciaux */}
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

            {/* Détails décoratifs */}
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
export { COMMERCIAL_BUILDINGS };
