'use client';

import { useGLTF } from '@react-three/drei';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

export default function GLBModel({
    path,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    opacity = 1,
    transparent = false,
    isPreview = false,
    ...props
}: any) {
    const { scene } = useGLTF(path) as any;

    // 1. Clone unique pour chaque instance
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    // 2. Détecter si c'est une route pour éviter les variations de couleurs
    const isRoad = path.toLowerCase().includes('road');

    // 3. Stabiliser l'uvOffset (uniquement si ce n'est pas une route)
    const uvOffset = useMemo(() => {
        if (isRoad) return new THREE.Vector2(0, 0);
        return new THREE.Vector2(Math.floor(Math.random() * 4) * 0.1, 0);
    }, [isRoad]);

    useEffect(() => {
        const materialsToDispose: THREE.Material[] = [];

        clonedScene.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
                // On clone le matériau
                child.material = child.material.clone();
                materialsToDispose.push(child.material);

                // --- LOGIQUE POUR LES BÂTIMENTS (NON-ROUTES) ---
                if (!isRoad) {
                    // Application du décalage de couleur (UV)
                    if (child.material.map) {
                        child.material.map = child.material.map.clone();
                        child.material.map.offset.add(uvOffset);
                        child.material.map.needsUpdate = true;
                    }
                    // Moins de brillance sur les bâtiments
                    child.material.roughness = 0.8;
                    child.material.color.multiplyScalar(0.95);
                } else {
                    // --- LOGIQUE SPÉCIFIQUE AUX ROUTES ---
                    // On veut que les routes soient bien mates et sombres
                    child.material.roughness = 1;
                    child.material.metalness = 0;
                    // On ne touche pas à l'UV offset pour que le bitume reste gris
                }

                // --- PARAMÈTRES COMMUNS ---
                child.material.transparent = transparent || opacity < 1;
                child.material.opacity = opacity;
                child.material.depthWrite = opacity >= 1;

                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return () => {
            materialsToDispose.forEach(m => m.dispose());
        };
    }, [clonedScene, opacity, transparent, isPreview, uvOffset, isRoad]);

    return (
        <primitive
            object={clonedScene}
            position={position}
            rotation={rotation}
            scale={scale}
            {...props}
        />
    );
}