'use client';

import React from 'react';
import GLBModel from '@/components/zones/GLBModel';

export function WaterTile({ x, z, type, rotation = 0 }: any) {
    const modelPaths: Record<string, string> = {
        'river': '/assets/models/nature/ground_riverStraight.glb',
        'river_straight': '/assets/models/nature/ground_riverStraight.glb',
        'river_corner': '/assets/models/nature/ground_riverCorner.glb',
    };

    return (
        <group position={[x, 0, z]} rotation={[0, rotation * Math.PI / 2, 0]}>
            {/* Le modèle 3D de la berge */}
            <GLBModel path={modelPaths[type] || modelPaths['river']} />
            
            {/* L'EAU : Un petit carré juste pour cette tuile */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial 
                    color="#0e7490" 
                    roughness={0.1} 
                    metalness={0.5} 
                />
            </mesh>
        </group>
    );
}