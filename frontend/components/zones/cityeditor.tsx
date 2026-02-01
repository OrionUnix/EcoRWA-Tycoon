'use client';

import React, { useState, useTransition } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import CameraRig from './CameraRig';
import Roads from '@/components/editor/Roads';
import Rivers from '@/components/editor/world/Rivers';
import NatureProps from '@/components/editor/world/NatureProps';
import BuildingTile from '@/components/editor/BuildingTile';
import { useCityManager } from '@/components/editor/config/useCityManager';
import TrafficManager from '@/components/editor/world/TrafficManager';

// Props du composant CityEditor
export default function CityEditor({ mode, isNight }: { mode: string | null, isNight: boolean }) {
    const { controls } = useThree() as any;
    const [isPending, startTransition] = useTransition();

    const {
        roadNetwork, riverNetwork, zones, props,
        updateCity, getPointsOnLine,
        ROAD_GRID, RIVER_GRID
    } = useCityManager();

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
    const [dragCurrent, setDragCurrent] = useState<THREE.Vector3 | null>(null);

    const onPointerUp = () => {
        if (isDragging && dragStart && dragCurrent) {
            const grid = (mode === 'WATER' || mode?.startsWith('NATURE:')) ? RIVER_GRID : ROAD_GRID;
            const points = getPointsOnLine(dragStart, dragCurrent, grid);

            startTransition(() => {
                updateCity(points, mode);
            });
        }
        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
        if (controls) controls.enabled = true;
    };

    const currentGrid = (mode === 'WATER' || mode?.startsWith('NATURE:')) ? RIVER_GRID : ROAD_GRID;
    const previewPoints = (isDragging && dragStart && dragCurrent)
        ? getPointsOnLine(dragStart, dragCurrent, currentGrid) : [];

    return (
        <group>
            <CameraRig />

            {/* Sol interactif pour le Drag & Drop */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.01, 0]}
                onPointerDown={(e) => {
                    if (!mode) return;
                    e.stopPropagation();
                    setIsDragging(true);
                    setDragStart(e.point.clone());
                    setDragCurrent(e.point.clone());
                    if (controls) controls.enabled = false;
                }}
                onPointerMove={(e) => isDragging && setDragCurrent(e.point.clone())}
                onPointerUp={onPointerUp}
            >
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#1e293b" transparent opacity={0} />
            </mesh>

            {/* Systèmes de rendu (Routes, Rivières, Trafic) */}
            <Rivers
                riverNetwork={riverNetwork}
                previewPoints={mode === 'WATER' ? previewPoints : []}
                gridSize={RIVER_GRID}
            />

            <Roads
                roadNetwork={roadNetwork}
                previewPoints={mode !== 'WATER' && !mode?.startsWith('NATURE:') ? previewPoints : []}
                mode={mode}
                gridSize={2}
                isNight={isNight}
            />

            <TrafficManager
                roads={roadNetwork}
                zones={zones}
                props={props}
                isNight={isNight}
            />

            <NatureProps props={props} />

            {/* Rendu des bâtiments existants */}
            {Array.from(zones.values()).map((z: any) => (
                <BuildingTile
                    key={`${z.x},${z.z}`}
                    position={[z.x, 0, z.z]} // Corrected to use position array
                    type={z.type}
                    building={z}
                    zone={z}
                    isNight={isNight}
                    roadNetwork={roadNetwork}
                    isBeingDestroyed={!!z.isBeingDestroyed}
                />
            ))}

            {/* Rendu de la prévisualisation lors du Dragging */}
            {isDragging && mode && ['RES', 'COM', 'IND'].includes(mode) && previewPoints.map((p: any, i: number) => (
                <BuildingTile
                    key={`pre-${i}`}
                    position={[p.x, 0, p.z]} // Corrected to use position array
                    type={mode}
                    roadNetwork={roadNetwork}
                    isNight={isNight}
                    isPreview={true}
                />
            ))}
        </group>
    );
}