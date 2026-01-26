'use client';

import React, { useState } from 'react';
import * as THREE from 'three';
import GLBModel from '@/components/zones/GLBModel';

export default function CityEditor({ mode }: { mode: string | null }) {
    const [roadNetwork, setRoadNetwork] = useState<Map<string, { x: number, z: number }>>(new Map());

    // États pour le dessin à la souris
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
    const [dragCurrent, setDragCurrent] = useState<THREE.Vector3 | null>(null);

    const gridSize = 2;

    // --- LOGIQUE DE CALCUL DES POINTS ---

    const getPointsOnLine = (start: THREE.Vector3, end: THREE.Vector3) => {
        const points: { x: number, z: number }[] = [];

        // Aligner sur la grille
        const startX = Math.round(start.x / gridSize) * gridSize;
        const startZ = Math.round(start.z / gridSize) * gridSize;
        const endX = Math.round(end.x / gridSize) * gridSize;
        const endZ = Math.round(end.z / gridSize) * gridSize;

        const diffX = endX - startX;
        const diffZ = endZ - startZ;

        // On dessine soit en X soit en Z (Ligne droite prioritaire sur l'axe le plus long)
        if (Math.abs(diffX) > Math.abs(diffZ)) {
            const steps = Math.abs(diffX) / gridSize;
            for (let i = 0; i <= steps; i++) {
                points.push({ x: startX + (Math.sign(diffX) * i * gridSize), z: startZ });
            }
        } else {
            const steps = Math.abs(diffZ) / gridSize;
            for (let i = 0; i <= steps; i++) {
                points.push({ x: startX, z: startZ + (Math.sign(diffZ) * i * gridSize) });
            }
        }
        return points;
    };

    // --- ÉVÉNEMENTS SOURIS ---

    const onPointerDown = (e: any) => {
        e.stopPropagation();
        if (mode !== 'ROAD') return;
        setIsDragging(true);
        setDragStart(e.point.clone());
        setDragCurrent(e.point.clone());
    };

    const onPointerMove = (e: any) => {
        if (!isDragging) return;
        setDragCurrent(e.point.clone());
    };

    const onPointerUp = (e: any) => {
        if (!isDragging || !dragStart || !dragCurrent) return;

        const points = getPointsOnLine(dragStart, dragCurrent);
        const newNet = new Map(roadNetwork);

        points.forEach(p => {
            newNet.set(`${p.x},${p.z}`, { x: p.x, z: p.z });
        });

        setRoadNetwork(newNet);
        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
    };

    // --- LOGIQUE KENNEY (Simplifiée pour la démo) ---
    const getRoadConfig = (x: number, z: number, network: Map<string, any>) => {
        const n = network.has(`${x},${z - gridSize}`);
        const s = network.has(`${x},${z + gridSize}`);
        const e = network.has(`${x + gridSize},${z}`);
        const w = network.has(`${x - gridSize},${z}`);
        let model = "road-straight.glb";
        let rotation = (e || w) ? 0 : Math.PI / 2;
        return { path: `/assets/models/roads/${model}`, rot: rotation };
    };

    // Calcul de la preview
    const previewPoints = (isDragging && dragStart && dragCurrent)
        ? getPointsOnLine(dragStart, dragCurrent)
        : [];

    return (
        <group>
            {/* SOL CAPTEUR */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, 0]}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial transparent opacity={0} />
            </mesh>

            <gridHelper args={[200, 100, 0x444444, 0x222222]} />

            {/* RENDU DES ROUTES EXISTANTES */}
            {Array.from(roadNetwork.values()).map((r) => {
                const config = getRoadConfig(r.x, r.z, roadNetwork);
                return (
                    <GLBModel key={`${r.x},${r.z}`} path={config.path} position={[r.x, 0, r.z]} rotation={[0, config.rot, 0]} scale={[2, 2, 2]} />
                );
            })}

            {/* RENDU DE LA PREVIEW (FANTÔME) */}
            {previewPoints.map((p, i) => (
                <group key={`preview-${i}`} opacity={0.5}>
                    <GLBModel
                        path="/assets/models/roads/road-straight.glb"
                        position={[p.x, 0.1, p.z]}
                        rotation={[0, (dragStart!.x !== dragCurrent!.x) ? 0 : Math.PI / 2, 0]}
                        scale={[2, 2, 2]}
                    />
                </group>
            ))}
        </group>
    );
}