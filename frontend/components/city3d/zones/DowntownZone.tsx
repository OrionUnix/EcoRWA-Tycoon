'use client';

/**
 * Zone Centre-ville (Downtown)
 * Gratte-ciels et immeubles de bureaux
 */

import { useMemo } from 'react';
import GLBModel from '../GLBModel';
import { COMMERCIAL_MODELS } from '@/lib/city3d/modelUtils';
import type { ZoneProps, Building3D } from '@/types/cityTypes';

// Configuration des bâtiments du centre-ville
const DOWNTOWN_BUILDINGS: Building3D[] = [
    {
        id: 'dt-sky-1',
        name: 'Eco-Tower 2030',
        type: { fr: 'Mixte', en: 'Mixed' },
        typeColor: 'green',
        zone: 'downtown',
        position: { x: 0, y: 0, z: 0 },
        model: { path: COMMERCIAL_MODELS['skyscraper-a'], scale: 1.2 },
        yield: '6.5%',
        price: '250 USDC',
        isMintable: true,
    },
    {
        id: 'dt-sky-2',
        name: 'Skyline Hub',
        type: { fr: 'Bureaux', en: 'Offices' },
        typeColor: 'indigo',
        zone: 'downtown',
        position: { x: 3, y: 0, z: 0 },
        model: { path: COMMERCIAL_MODELS['skyscraper-b'], scale: 1.0 },
        yield: '5.9%',
        price: '400 USDC',
        isMintable: false,
    },
    {
        id: 'dt-sky-3',
        name: 'Data Center X',
        type: { fr: 'Infrastructure', en: 'Infrastructure' },
        typeColor: 'violet',
        zone: 'downtown',
        position: { x: 6, y: 0, z: 0 },
        model: { path: COMMERCIAL_MODELS['skyscraper-c'], scale: 1.1 },
        yield: '14.0%',
        price: '700 USDC',
        isMintable: false,
    },
    {
        id: 'dt-off-1',
        name: 'Tech Plaza',
        type: { fr: 'Bureaux', en: 'Offices' },
        typeColor: 'blue',
        zone: 'downtown',
        position: { x: 0, y: 0, z: 3 },
        model: { path: COMMERCIAL_MODELS['building-e'], scale: 0.8 },
    },
    {
        id: 'dt-off-2',
        name: 'Finance Tower',
        type: { fr: 'Bureaux', en: 'Offices' },
        typeColor: 'indigo',
        zone: 'downtown',
        position: { x: 3, y: 0, z: 3 },
        model: { path: COMMERCIAL_MODELS['skyscraper-d'], scale: 0.9 },
    },
    {
        id: 'dt-sky-4',
        name: 'Innovation Center',
        type: { fr: 'Mixte', en: 'Mixed' },
        typeColor: 'cyan',
        zone: 'downtown',
        position: { x: 6, y: 0, z: 3 },
        model: { path: COMMERCIAL_MODELS['skyscraper-e'], scale: 1.0 },
    },
];

interface DowntownZoneProps extends ZoneProps {
    selectedBuildingId?: string | null;
}

export default function DowntownZone({
    position = [0, 0, 0],
    onBuildingClick,
    selectedBuildingId,
}: DowntownZoneProps) {

    const buildings = useMemo(() => DOWNTOWN_BUILDINGS, []);

    return (
        <group position={position}>
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
                    rotation={[0, building.model.rotation?.y || 0, 0]}
                    onClick={() => onBuildingClick?.(building)}
                    isSelected={selectedBuildingId === building.id}
                />
            ))}
        </group>
    );
}

// Export des données pour l'info panel
export { DOWNTOWN_BUILDINGS };
