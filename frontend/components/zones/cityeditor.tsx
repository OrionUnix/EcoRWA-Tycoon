'use client';

import React, { useState, useTransition } from 'react';
import { useThree } from '@react-three/fiber';
import CameraRig from './CameraRig';
import Roads from '@/components/editor/Roads';
import Rivers from '@/components/editor/world/Rivers';
import NatureProps from '@/components/editor/world/NatureProps'; 
import BuildingTile from '@/components/editor/BuildingTile';
import { useCityManager } from '@/components/editor/config/useCityManager';
import TrafficManager from '@/components/editor/world/TrafficManager';

// Ajout de isNight dans les props ici !
export default function CityEditor({ mode, isNight }: { mode: string | null, isNight: boolean }) {
    const { controls } = useThree() as any;
    const [isPending, startTransition] = useTransition();

    // ON A SUPPRIMÉ LE useState(false) ICI car on utilise celui du parent

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
            
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} 
                  onPointerDown={(e) => {
                      if (!mode) return;
                      setIsDragging(true);
                      setDragStart(e.point.clone());
                      setDragCurrent(e.point.clone());
                      if (controls) controls.enabled = false;
                  }}
                  onPointerMove={(e) => isDragging && setDragCurrent(e.point.clone())}
                  onPointerUp={onPointerUp}>
                <planeGeometry args={[100, 100]} />
               <meshStandardMaterial color="#1e293b" />
            </mesh>

            

            <Rivers riverNetwork={riverNetwork} previewPoints={mode === 'WATER' ? previewPoints : []} gridSize={RIVER_GRID} />
            
            {/* isNight est maintenant correctement transmis ! */}
            <Roads 
                roadNetwork={roadNetwork} 
                previewPoints={previewPoints}
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

            {Array.from(zones.values()).map((z) => (
                <BuildingTile 
                    key={`${z.x},${z.z}`} 
                    {...z} 
                    roadNetwork={roadNetwork} 
                    isBeingDestroyed={mode === 'ROAD' && previewPoints.some(p => p.x === z.x && p.z === z.z)}
                />
            ))}

            {isDragging && ['RES', 'COM', 'IND'].includes(mode!) && previewPoints.map((p, i) => (
                <BuildingTile key={`pre-${i}`} x={p.x} z={p.z} type={mode} roadNetwork={roadNetwork} isPreview={true} />
            ))}
        </group>
    );
}