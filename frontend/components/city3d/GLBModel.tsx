'use client';

/**
 * Composant générique pour charger et afficher un modèle GLB
 * Utilisé par tous les autres composants de la ville 3D
 */

import { useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { GLBModelProps } from '@/types/cityTypes';

export default function GLBModel({
    path,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    onClick,
    onHover,
    isSelected = false,
    isHovered = false,
}: GLBModelProps) {
    const groupRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF(path);
    const [localHovered, setLocalHovered] = useState(false);

    // Clone de la scène pour éviter les conflits si le même modèle est utilisé plusieurs fois
    const clonedScene = scene.clone();

    // Effet de sélection/hover sur les matériaux
    useEffect(() => {
        if (!groupRef.current) return;

        groupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const material = child.material as THREE.MeshStandardMaterial;

                if (isSelected) {
                    material.emissive = new THREE.Color(0x3b82f6);
                    material.emissiveIntensity = 0.3;
                } else if (localHovered || isHovered) {
                    material.emissive = new THREE.Color(0x60a5fa);
                    material.emissiveIntensity = 0.15;
                } else {
                    material.emissive = new THREE.Color(0x000000);
                    material.emissiveIntensity = 0;
                }
            }
        });
    }, [isSelected, isHovered, localHovered]);

    const handlePointerOver = (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        setLocalHovered(true);
        onHover?.(true);
    };

    const handlePointerOut = (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        document.body.style.cursor = 'auto';
        setLocalHovered(false);
        onHover?.(false);
    };

    const handleClick = (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onClick?.();
    };

    // Normaliser le scale
    const normalizedScale = typeof scale === 'number'
        ? [scale, scale, scale] as [number, number, number]
        : scale;

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            scale={normalizedScale}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
        >
            <primitive object={clonedScene} />
        </group>
    );
}

// Preload helper - À utiliser en dehors du composant pour optimiser
GLBModel.preload = (path: string) => {
    useGLTF.preload(path);
};
