'use client';

import React, { useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import GLBModel from '@/components/zones/GLBModel';
import CameraRig from './CameraRig';

export default function CityEditor({ mode }: { mode: string | null }) {
    const { controls } = useThree() as any;
    const [roadNetwork, setRoadNetwork] = useState<Map<string, { x: number, z: number }>>(new Map());

    // États pour le drag-and-drop
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
    const [dragCurrent, setDragCurrent] = useState<THREE.Vector3 | null>(null);

    const gridSize = 2;

    // --- LOGIQUE DE CALCUL DES POINTS (Ligne droite parfaite) ---
    const getPointsOnLine = (start: THREE.Vector3, end: THREE.Vector3) => {
        const points: { x: number, z: number }[] = [];
        const sX = Math.round(start.x / gridSize) * gridSize;
        const sZ = Math.round(start.z / gridSize) * gridSize;
        const eX = Math.round(end.x / gridSize) * gridSize;
        const eZ = Math.round(end.z / gridSize) * gridSize;

        const diffX = eX - sX;
        const diffZ = eZ - sZ;

        // On dessine sur l'axe le plus étiré
        if (Math.abs(diffX) > Math.abs(diffZ)) {
            const steps = Math.abs(diffX) / gridSize;
            for (let i = 0; i <= steps; i++) {
                points.push({ x: sX + (Math.sign(diffX) * i * gridSize), z: sZ });
            }
        } else {
            const steps = Math.abs(diffZ) / gridSize;
            for (let i = 0; i <= steps; i++) {
                points.push({ x: sX, z: sZ + (Math.sign(diffZ) * i * gridSize) });
            }
        }
        return points;
    };

    // --- GESTION DES CLICS ---
    const onPointerDown = (e: any) => {
        // On accepte ROAD ou DELETE
        if (!mode) return;
        e.stopPropagation();

        setIsDragging(true);
        setDragStart(e.point.clone());
        setDragCurrent(e.point.clone());

        if (controls) controls.enabled = false;
    };

    const onPointerMove = (e: any) => {
        if (!isDragging) return;
        setDragCurrent(e.point.clone());
    };

    const onPointerUp = () => {
        if (isDragging && dragStart && dragCurrent) {
            const points = getPointsOnLine(dragStart, dragCurrent);
            const newNet = new Map(roadNetwork);

            points.forEach(p => {
                const key = `${p.x},${p.z}`;
                if (mode === 'ROAD') {
                    newNet.set(key, { x: p.x, z: p.z });
                } else if (mode === 'DELETE') {
                    newNet.delete(key);
                }
            });

            setRoadNetwork(newNet);
        }

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
        if (controls) controls.enabled = true;
    };

    // --- LOGIQUE DE SÉLECTION DES MODÈLES ---
    const getRoadConfig = (x: number, z: number, network: Map<string, any>) => {
        const n = network.has(`${x},${z - gridSize}`);
        const s = network.has(`${x},${z + gridSize}`);
        const e = network.has(`${x + gridSize},${z}`);
        const w = network.has(`${x - gridSize},${z}`);

        const neighborsCount = [n, s, e, w].filter(Boolean).length;
        let model = "road-straight.glb";
        let rotation = 0;
        let decoType: 'LIGHT' | 'CONE' | null = null; // On a retiré 'SIGN'

        // 1. Cul-de-sacs
        if (neighborsCount === 1) {
            model = "road-end-round.glb";
            if (n) rotation = Math.PI / 2;
            if (w) rotation = Math.PI / 1;
            if (s) rotation = -Math.PI / 2;
            if (e) rotation = 0;
            decoType = 'CONE';
        }
        // 2. Croisement 4-voies
        else if (n && s && e && w) {
            model = "road-crossroad.glb";
        }
        // 3. Intersections en T (Plus de panneaux ici)
        else if (w && e && s) { model = "road-intersection.glb"; rotation = 0; }
        else if (w && e && n) { model = "road-intersection.glb"; rotation = Math.PI; }
        else if (n && s && e) { model = "road-intersection.glb"; rotation = Math.PI / 2; }
        else if (n && s && w) { model = "road-intersection.glb"; rotation = -Math.PI / 2; }

        // 4. Virages
        else if (s && e) { model = "road-bend.glb"; rotation = Math.PI / 2; }
        else if (s && w) { model = "road-bend.glb"; rotation = 0; }
        else if (n && w) { model = "road-bend.glb"; rotation = -Math.PI / 2; }
        else if (n && e) { model = "road-bend.glb"; rotation = Math.PI; }

        // 5. Lignes droites et Passages piétons
        else {
            // Un passage piéton tous les 6 segments
            const isCrossing = Math.abs((x + z) / gridSize) % 6 === 0;
            model = isCrossing ? "road-crossing.glb" : "road-straight.glb";
            rotation = (e || w) ? 0 : Math.PI / 2;

            // Lampadaire : seulement si ce n'est pas un passage piéton et bien espacés
            if (!isCrossing && Math.abs(x + z) % 10 === 0) decoType = 'LIGHT';
        }

        return {
            path: `/assets/models/roads/${model}`,
            rot: rotation,
            deco: decoType
        };
    };
    const previewPoints = (isDragging && dragStart && dragCurrent) ? getPointsOnLine(dragStart, dragCurrent) : [];

    return (
        <group>
            <CameraRig />
            {/* SOL CAPTEUR : C'est lui qui gère tout */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, 0]}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerOut={onPointerUp}
            >
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial transparent opacity={0} />
            </mesh>

            <gridHelper args={[200, 100, 0x475569, 0x1e293b]} />

            {/* RENDU DES ROUTES EXISTANTES */}
            {Array.from(roadNetwork.values()).map((r) => {
                const config = getRoadConfig(r.x, r.z, roadNetwork);

                // Déterminer si la route est horizontale (e/w) ou verticale (n/s)
                const isHorizontal = config.rot === 0 || config.rot === Math.PI;

                return (
                    <group key={`${r.x},${r.z}`}>
                        {/* 1. La Route / Passage Piéton */}
                        <GLBModel
                            path={config.path}
                            position={[r.x, 0, r.z]}
                            rotation={[0, config.rot, 0]}
                            scale={[2, 2, 2]}
                        />

                        {/* 2. Signalisation spécifique pour Croisement / T-junction */}
                        {config.deco === 'SIGN' && (
                            <GLBModel
                                path="/assets/models/roads/sign-highway.glb"
                                // On le place sur le coin pour ne pas gêner la route
                                position={[r.x + 0.8, 0, r.z + 0.8]}
                                rotation={[0, config.rot, 0]}
                                scale={[2, 2, 2]}
                            />
                        )}

                        {/* 3. Lampadaire */}
                        {config.deco === 'LIGHT' && (
                            <GLBModel
                                path="/assets/models/roads/light-curved.glb"
                                position={[
                                    isHorizontal ? r.x : r.x + 0.75,
                                    0,
                                    isHorizontal ? r.z + 0.75 : r.z
                                ]}
                                rotation={[0, isHorizontal ? 0 : Math.PI / 2, 0]}
                                scale={[2, 2, 2]}
                            />
                        )}

                        {/* 3. Le Cône (Dans le cul-de-sac) */}
                        {config.deco === 'CONE' && (
                            <GLBModel
                                path="/assets/models/roads/construction-cone.glb"
                                // Placé au centre de la voie à l'extrémité
                                position={[r.x, 0, r.z]}
                                scale={[2, 2, 2]}
                            />
                        )}
                    </group>
                );
            })}
            {/* PREVIEW : Bleue pour la route, Rouge pour le bulldozer */}
            {previewPoints.map((p, i) => {
                const isHorizontal = dragStart!.z === dragCurrent!.z;
                return (
                    <group key={`preview-${i}`}>
                        {mode === 'ROAD' ? (
                            <GLBModel
                                path="/assets/models/roads/road-straight.glb"
                                position={[p.x, 0.05, p.z]}
                                rotation={[0, isHorizontal ? 0 : Math.PI / 2, 0]}
                                scale={[2, 2, 2]}
                            />
                        ) : (
                            <mesh position={[p.x, 0.1, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
                                <planeGeometry args={[1.9, 1.9]} />
                                <meshStandardMaterial color="#ff4444" transparent opacity={0.6} />
                            </mesh>
                        )}
                    </group>
                );
            })}
        </group>
    );
}