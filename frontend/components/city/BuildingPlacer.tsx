'use client';

import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface BuildingPlacerProps {
    cityScene: THREE.Group;
}

const BUILDING_POOLS = {
    commercial: [
        '/assets/models/commercial/shop-small.glb',
        '/assets/models/commercial/restaurant.glb',
        '/assets/models/commercial/cafe.glb',
        '/assets/models/commercial/store-medium.glb',
    ],
    industrial: [
        '/assets/models/industrial/warehouse.glb',
        '/assets/models/industrial/factory-small.glb',
        '/assets/models/industrial/storage.glb',
    ],
    suburban: [
        '/assets/models/suburban/house-modern.glb',
        '/assets/models/suburban/house-classic.glb',
        '/assets/models/suburban/townhouse.glb',
    ],
};

export default function BuildingPlacer({ cityScene }: BuildingPlacerProps) {
    const buildingPlacements = useMemo(() => {
        if (!cityScene) return [];

        const placements: any[] = [];
        const tiles: any[] = [];

        cityScene.traverse((child: any) => {
            if (child.name && child.name.includes('Set_B_Tiles_')) {
                // Utilisation de clone() pour s'assurer que worldPos est stable
                const worldPos = child.getWorldPosition(new THREE.Vector3());
                tiles.push({
                    name: child.name,
                    position: worldPos.clone(),
                });
            }
        });

        const categories = Object.keys(BUILDING_POOLS) as Array<keyof typeof BUILDING_POOLS>;

        tiles.forEach((tile, index) => {
            // Un bâtiment sur trois pour la clarté
            if (index % 3 === 0) {
                const category = categories[index % categories.length];
                const models = BUILDING_POOLS[category];
                const modelPath = models[Math.floor(Math.random() * models.length)];

                placements.push({
                    id: `placed_${index}_${tile.name}`,
                    modelPath: modelPath,
                    position: tile.position,
                    rotation: Math.random() * Math.PI * 2,
                    scale: 0.8 + Math.random() * 0.4,
                });
            }
        });

        return placements;
    }, [cityScene]);

    return (
        <group name="BuildingPlacements">
            {buildingPlacements.map((placement) => (
                <Suspense key={placement.id} fallback={null}>
                    <PlacedBuilding {...placement} />
                </Suspense>
            ))}
        </group>
    );
}

function PlacedBuilding({ modelPath, position, rotation, scale }: any) {
    const gltf = useGLTF(modelPath, undefined, undefined, (error) => {
        console.error("Erreur de chargement pour :", modelPath, error);
    }) as any;

    const clonedModel = useMemo(() => {
        // On vérifie que la scène existe (protection supplémentaire)
        if (!gltf || !gltf.scene) return null;

        const cloned = gltf.scene.clone();
        cloned.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Optimisation : désactiver la matrice auto si le bâtiment est fixe
                child.matrixAutoUpdate = false;
                child.updateMatrix();
            }
        });
        return cloned;
    }, [gltf]);

    if (!clonedModel) return null;

    return (
        <primitive
            object={clonedModel}
            position={[position.x, position.y, position.z]}
            rotation={[0, rotation, 0]}
            scale={[scale, scale, scale]} // Utilisation d'un array pour le scale uniforme
        />
    );
}