import React, { useMemo, memo } from 'react';
import { Html } from '@react-three/drei';
import GLBModel from '@/components/zones/GLBModel';
import { ZONE_TYPES } from '@/components/editor/config/zoneAssets';

export default function BuildingTile({ x, z, type, roadNetwork, isPreview, isBeingDestroyed, id, isMintable, isOwned, onClick }: any) {
    const zone = useMemo(() =>
        Object.values(ZONE_TYPES).find((zType: any) => zType.id === type),
        [type]);

    const visualProps = useMemo(() => {
        const zoneAny = zone as any;
        if (!zoneAny || !zoneAny.models || !zoneAny.models.length) return null;

        const seed = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453);
        const modelData = zoneAny.models[Math.floor(seed % zoneAny.models.length)];

        const FRONT_OFFSET = Math.PI;
        let rot = 0;
        let offsetX = 0;
        let offsetZ = 0;

        const isLarge = modelData.size === 2;
        const margin = 0;

        if (roadNetwork?.has(`${x + 2},${z}`)) {
            rot = Math.PI / 2;
            offsetX = margin;
        } else if (roadNetwork?.has(`${x - 2},${z}`)) {
            rot = -Math.PI / 2;
            offsetX = -margin;
        } else if (roadNetwork?.has(`${x},${z + 2}`)) {
            rot = 0;
            offsetZ = margin;
        } else if (roadNetwork?.has(`${x},${z - 2}`)) {
            rot = Math.PI;
            offsetZ = -margin;
        } else {
            rot = (Math.floor(seed * 10) % 4) * (Math.PI / 2);
        }

        const zoneColor = (zone as any).color || (type === 'RES' ? '#22c55e' : type === 'COM' ? '#3b82f6' : '#eab308');

        return {
            fullPath: `${zoneAny.path}${modelData.file}`,
            rotation: rot + FRONT_OFFSET,
            scale: 0.95,
            color: zoneColor,
            offset: [offsetX, 0, offsetZ],
            height: isLarge ? 2.2 : 1.3
        };
    }, [x, z, zone, roadNetwork, type]);

    if (!zone || !visualProps) return null;

    const opacity = isPreview ? 0.4 : (isBeingDestroyed ? 0.15 : 1.0);

    return (
        <group position={[x + visualProps.offset[0], 0, z + visualProps.offset[2]]}>
            {/* Tokenized Marker */}
            {isMintable && !isOwned && !isPreview && (
                <Html position={[0, visualProps.height, 0]} center distanceFactor={10}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/90 text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-bounce select-none border-2 border-white/20 text-lg">
                        $
                    </div>
                </Html>
            )}

            {/* Owned Marker */}
            {isOwned && !isPreview && (
                <Html position={[0, visualProps.height, 0]} center distanceFactor={10}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/90 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse select-none border-2 border-white/20 text-lg">
                        🏠
                    </div>
                </Html>
            )}

            {/* Carré au sol */}
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
                onClick={(e: any) => {
                    e.stopPropagation();
                    if (onClick && id) onClick(id);
                }}
            />
        </group>
    );
}
