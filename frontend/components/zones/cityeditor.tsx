'use client';

import React, { useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import CameraRig from './CameraRig';
import Roads from '@/components/editor/Roads';
import BuildingTile from '@/components/editor/BuildingTile';

export default function CityEditor({ mode }: { mode: string | null }) {
    const { controls } = useThree() as any;
    const gridSize = 2;

    // ÉTATS
    const [roadNetwork, setRoadNetwork] = useState<Map<string, { x: number, z: number }>>(new Map());
    const [zones, setZones] = useState<Map<string, { x: number, z: number, type: string }>>(new Map());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
    const [dragCurrent, setDragCurrent] = useState<THREE.Vector3 | null>(null);

    // LOGIQUE DE GRILLE
    const getPointsOnLine = (start: THREE.Vector3, end: THREE.Vector3) => {
        const points: { x: number, z: number }[] = [];
        const sX = Math.round(start.x / gridSize) * gridSize;
        const sZ = Math.round(start.z / gridSize) * gridSize;
        const eX = Math.round(end.x / gridSize) * gridSize;
        const eZ = Math.round(end.z / gridSize) * gridSize;

        const diffX = eX - sX;
        const diffZ = eZ - sZ;

        if (Math.abs(diffX) > Math.abs(diffZ)) {
            const steps = Math.abs(diffX) / gridSize;
            for (let i = 0; i <= steps; i++) points.push({ x: sX + (Math.sign(diffX) * i * gridSize), z: sZ });
        } else {
            const steps = Math.abs(diffZ) / gridSize;
            for (let i = 0; i <= steps; i++) points.push({ x: sX, z: sZ + (Math.sign(diffZ) * i * gridSize) });
        }
        return points;
    };

    const canPlaceZone = (x: number, z: number) => {
        const neighbors = [
            `${x + gridSize},${z}`, `${x - gridSize},${z}`,
            `${x},${z + gridSize}`, `${x},${z - gridSize}`
        ];
        return neighbors.some(key => roadNetwork.has(key));
    };

    // INTERACTIONS
    const onPointerDown = (e: any) => {
        if (!mode) return;
        e.stopPropagation();
        setIsDragging(true);
        setDragStart(e.point.clone());
        setDragCurrent(e.point.clone());
        if (controls) controls.enabled = false;
    };

    const onPointerMove = (e: any) => {
        if (isDragging) setDragCurrent(e.point.clone());
    };

    const onPointerUp = () => {
        if (isDragging && dragStart && dragCurrent) {
            const points = getPointsOnLine(dragStart, dragCurrent);
            
            if (mode === 'ROAD' || mode === 'DELETE') {
                const newNet = new Map(roadNetwork);
                const newZones = new Map(zones);
                points.forEach(p => {
                    const key = `${p.x},${p.z}`;
                    if (mode === 'ROAD') {
                        newNet.set(key, { x: p.x, z: p.z });
                        newZones.delete(key);
                    } else {
                        newNet.delete(key);
                        newZones.delete(key);
                    }
                });
                setRoadNetwork(newNet);
                setZones(newZones);
            }

            if (['RES', 'COM', 'IND'].includes(mode!)) {
                const newZones = new Map(zones);
                points.forEach(p => {
                    const key = `${p.x},${p.z}`;
                    if (!roadNetwork.has(key) && !zones.has(key) && canPlaceZone(p.x, p.z)) {
                        newZones.set(key, { x: p.x, z: p.z, type: mode! });
                    }
                });
                setZones(newZones);
            }
        }
        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
        if (controls) controls.enabled = true;
    };

    const previewPoints = (isDragging && dragStart && dragCurrent) ? getPointsOnLine(dragStart, dragCurrent) : [];

    return (
        <group>
            <CameraRig />
            
            {/* SOL INVISIBLE POUR LE RAYCASTING */}
            <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, -0.01, 0]} 
                onPointerDown={onPointerDown} 
                onPointerMove={onPointerMove} 
                onPointerUp={onPointerUp}
            >
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial transparent opacity={0} />
            </mesh>

            {/* GRILLE (gridHelper) */}
            <gridHelper args={[200, 100, 0x475569, 0x1e293b]} position={[0, 0.01, 0]} />

            {/* PREVIEW "FANTÔME" LORS DU DRAG */}
            {mode && ['RES', 'COM', 'IND'].includes(mode) && previewPoints.map((p, i) => (
                <BuildingTile 
                    key={`preview-${i}`}
                    x={p.x} 
                    z={p.z} 
                    type={mode} 
                    roadNetwork={roadNetwork} 
                    isPreview={true} 
                />
            ))}

            {/* BÂTIMENTS POSÉS */}
            {Array.from(zones.values()).map((z) => {
                const beingDestroyed = mode === 'ROAD' && previewPoints.some(p => p.x === z.x && p.z === z.z);
                return (
                    <BuildingTile 
                        key={`${z.x},${z.z}`} 
                        x={z.x} 
                        z={z.z} 
                        type={z.type} 
                        roadNetwork={roadNetwork}
                        isBeingDestroyed={beingDestroyed}
                    />
                );
            })}

            <Roads 
                roadNetwork={roadNetwork} 
                previewPoints={mode === 'ROAD' ? previewPoints : []} 
                mode={mode} 
                gridSize={gridSize} 
            />
        </group>
    );
}