'use client';

import React, { useState, useMemo } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSelectedBuilding } from '@/hooks/useSelectedBuilding';
import { ZONE_TYPES, fixPath } from '@/components/editor/config/zoneAssets';

// 🛡️ ON EXPORTE L'INTERFACE POUR QU'ELLE SOIT RECONNUE PARTOUT
export interface BuildingTileProps {
    position: [number, number, number];
    type: string;
    building?: any;
    zone?: any;
    isNight?: boolean;
    id?: number;
    isMintable?: boolean;
    isOwned?: boolean;
    onBuildingClick?: (id: number) => void;
    // On ajoute un index de signature pour accepter d'autres props sans crash
    [key: string]: any;
}

const getRandomModelPath = (building: any, zoneId: any): { path: string; scale: number } => {
    const idStr = String(zoneId || 'default-0-0');
    const seed = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const category = building?.category || 'RESIDENTIAL';

    let categoryData = ZONE_TYPES.RESIDENTIAL;
    if (category === 'COM' || category === 'COMMERCIAL') categoryData = ZONE_TYPES.COMMERCIAL;
    if (category === 'IND' || category === 'INDUSTRIAL') categoryData = ZONE_TYPES.INDUSTRIAL;

    const models = categoryData.models;
    const randomIndex = seed % models.length;
    const selectedModel = models[randomIndex];

    const isLoft = selectedModel.file?.includes('loft-saint-germain');
    const baseScale = isLoft ? 0.055 : (selectedModel.size === 1 ? 0.7 : 0.5);

    return {
        path: fixPath(`${categoryData.path}${selectedModel.file}`),
        scale: baseScale
    };
};

export function BuildingTile({
    position,
    type,
    building,
    zone,
    onBuildingClick
}: BuildingTileProps) {
    const [hovered, setHovered] = useState(false);
    const selectBuilding = useSelectedBuilding((state) => state.selectBuilding);
    const selectedBuilding = useSelectedBuilding((state) => state.selectedBuilding);

    const isSelected = selectedBuilding?.id === building?.id;

    const { path: modelPath, scale: modelScale } = useMemo(
        () => getRandomModelPath(building, zone?.id || `${position[0]}-${position[2]}`),
        [building, zone?.id, position]
    );

    const { scene } = useGLTF(modelPath);
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    const handleClick = (e: any) => {
        e.stopPropagation();
        if (building) selectBuilding(building);
        if (onBuildingClick && (building?.id || zone?.id)) {
            onBuildingClick(building?.id || zone?.id);
        }
    };

    return (
        <group position={position}>
            <group
                onClick={handleClick}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                onPointerOut={() => setHovered(false)}
                scale={[modelScale, modelScale, modelScale]}
            >
                {clonedScene ? (
                    <primitive object={clonedScene} />
                ) : (
                    <mesh castShadow>
                        <boxGeometry args={[2, 4, 2]} />
                        <meshStandardMaterial color={hovered ? "white" : "purple"} />
                    </mesh>
                )}
            </group>
        </group>
    );
}

export default BuildingTile;