'use client';

import React, { useMemo } from 'react';
import { Instances, Instance, useGLTF } from '@react-three/drei';
import GLBModel from '@/components/zones/GLBModel';

export function World({ seed = "0x123...", size = 50 }) {
    // 1. On génère la carte une seule fois
    const mapData = useMemo(() => {
        // Logique simplifiée pour l'exemple
        const data = [];
        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                data.push({ id: `${x}-${z}`, pos: [x, 0, z] });
            }
        }
        return data;
    }, [size, seed]);

    // 2. On charge le modèle de base pour l'herbe
    const { nodes, materials } = useGLTF('/assets/models/nature/ground_grass.glb');

    return (
        <group>
            {/* On dessine TOUTE l'herbe en un seul appel (très performant) */}
            <Instances range={mapData.length} geometry={(nodes.Plane as any).geometry} material={materials.Main}>
                {mapData.map((d) => (
                    <Instance key={d.id} position={d.pos as any} />
                ))}
            </Instances>

            {/* On ajoute les éléments décoratifs par-dessus (ex: arbres) */}
            {/* Ici tu pourrais filtrer tes données pour poser des arbres via GLBModel */}
        </group>
    );
}