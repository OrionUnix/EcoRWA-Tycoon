'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const MAPPED_BUILDINGS: Record<string, { id: number; name: string; position: THREE.Vector3 }> = {
    "Eco_Building_Slope.005": {
        id: 1,
        name: 'Saint-Germain Loft',
        position: new THREE.Vector3(-15, 25, -10)
    },
    "Regular_Building_TwistedTower_large.004": {
        id: 2,
        name: 'Central Bistro',
        position: new THREE.Vector3(0, 35, 0)
    },
    "Eco_Building_Terrace.008": {
        id: 3,
        name: 'Eco-Tower 2030',
        position: new THREE.Vector3(15, 30, 10)
    },
};

interface SaleIconsProps {
    cityScene: THREE.Group;
    ownedBuildingIds: number[];
}

export default function SaleIcons({ cityScene, ownedBuildingIds }: SaleIconsProps) {
    const buildingPositions = useMemo(() => {
        if (!cityScene) return [];

        const positions: any[] = [];

        // Find position of each mapped building
        Object.entries(MAPPED_BUILDINGS).forEach(([nodeName, data]) => {
            // Skip if already owned
            if (ownedBuildingIds.includes(data.id)) return;

            let found = false;
            cityScene.traverse((child: any) => {
                if (child.name === nodeName && !found) {
                    const worldPos = child.getWorldPosition(new THREE.Vector3());

                    // Get bounding box to find roof height
                    const bbox = new THREE.Box3().setFromObject(child);
                    const height = bbox.max.y - bbox.min.y;

                    positions.push({
                        id: data.id,
                        name: data.name,
                        position: new THREE.Vector3(
                            worldPos.x,
                            worldPos.y + height + 5, // Above roof
                            worldPos.z
                        ),
                    });
                    found = true;
                }
            });
        });

        console.log(`💰 Showing ${positions.length} sale icons`);
        return positions;
    }, [cityScene, ownedBuildingIds]);

    return (
        <group>
            {buildingPositions.map((building) => (
                <FloatingDollarIcon
                    key={building.id}
                    position={building.position}
                    name={building.name}
                />
            ))}
        </group>
    );
}

function FloatingDollarIcon({ position, name }: { position: THREE.Vector3; name: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const timeRef = useRef(Math.random() * Math.PI * 2);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Bobbing animation
        timeRef.current += delta * 2;
        const offset = Math.sin(timeRef.current) * 0.3;
        meshRef.current.position.y = position.y + offset;

        // Billboard effect - always face camera
        meshRef.current.lookAt(state.camera.position);
    });

    return (
        <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
            {/* Dollar sign background */}
            <circleGeometry args={[1.5, 32]} />
            <meshBasicMaterial
                color="#FFD700"
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
            />

            {/* HTML overlay for crisp $ symbol */}
            <Html
                center
                distanceFactor={8}
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            >
                <div
                    style={{
                        fontSize: '48px',
                        fontWeight: 'bold',
                        color: '#1a5f1a',
                        textShadow: '0 0 10px rgba(255,215,0,0.8)',
                        fontFamily: 'monospace',
                    }}
                >
                    $
                </div>
            </Html>
        </mesh>
    );
}
