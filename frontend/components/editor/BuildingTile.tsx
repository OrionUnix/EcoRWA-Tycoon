'use client';

import React, { useMemo, memo } from 'react'; // Ajoutez memo
import GLBModel from '@/components/zones/GLBModel';
import { ZONE_TYPES } from '@/components/editor/config/zoneAssets';

export default function BuildingTile({ x, z, type, roadNetwork, isPreview, isBeingDestroyed }: any) {
    const zone = useMemo(() => 
        Object.values(ZONE_TYPES).find(zType => zType.id === type), 
    [type]);

    const visualProps = useMemo(() => {
        if (!zone || !zone.models || !zone.models.length) return null;

        const seed = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453);
        const modelData = zone.models[Math.floor(seed % zone.models.length)];
        
        const FRONT_OFFSET = Math.PI; 
        let rot = 0;
        let offsetX = 0;
        let offsetZ = 0;

        // On définit une marge plus grande pour les bâtiments de taille 2
        // car ils ont souvent des éléments qui dépassent (tuyaux jaunes, etc.)
        const isLarge = modelData.size === 2;
        const margin = isLarge ? 0.35 : 0.2; 

        if (roadNetwork?.has(`${x + 2},${z}`)) {
            rot = Math.PI / 2;
            offsetX = -margin;
        } else if (roadNetwork?.has(`${x - 2},${z}`)) {
            rot = -Math.PI / 2;
            offsetX = margin;
        } else if (roadNetwork?.has(`${x},${z + 2}`)) {
            rot = 0;
            offsetZ = -margin;
        } else if (roadNetwork?.has(`${x},${z - 2}`)) {
            rot = Math.PI;
            offsetZ = margin;
        } else {
            // Si pas de route, on centre mais on réduit quand même
            rot = (Math.floor(seed * 10) % 4) * (Math.PI / 2);
        }

        const zoneColor = (zone as any).color || (type === 'RES' ? '#22c55e' : type === 'COM' ? '#3b82f6' : '#eab308');

        return { 
            fullPath: `${zone.path}${modelData.file}`, 
            rotation: rot + FRONT_OFFSET,
            // Échelle réduite drastiquement pour les industriels de taille 2
            scale: isLarge ? 1.8 : 1.7, 
            color: zoneColor,
            offset: [offsetX, 0, offsetZ]
        };
    }, [x, z, zone, roadNetwork, type]);

    if (!zone || !visualProps) return null;

    const opacity = isPreview ? 0.4 : (isBeingDestroyed ? 0.15 : 1.0);

    return (
        <group position={[x + visualProps.offset[0], 0, z + visualProps.offset[2]]}>
            {/* Carré au sol : on le garde petit pour ne jamais toucher le trottoir */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                <planeGeometry args={[1.7, 1.7]} />
                <meshStandardMaterial 
                    color={visualProps.color} 
                    transparent 
                    opacity={isPreview ? 0.3 : (isBeingDestroyed ? 0.1 : 0.6)} 
                />
            </mesh>

            <GLBModel 
                path={visualProps.fullPath} 
                rotation={[0, visualProps.rotation, 0]}
                scale={[visualProps.scale, visualProps.scale, visualProps.scale]}
                transparent={opacity < 1}
                opacity={opacity}
            />
        </group>
    );
}