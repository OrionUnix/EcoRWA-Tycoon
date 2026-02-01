'use client';

import { useMemo } from 'react';
import GLBModel from './GLBModel';
import { ROAD_MODELS } from '@/lib/city3d/modelUtils';

interface RoadNetworkProps {
    gridSize?: number;
    isNight?: boolean;
}

export default function RoadNetwork({ gridSize = 40, isNight = true }: RoadNetworkProps) {
    const roadElements = useMemo(() => {
        const elements: any[] = [];
        const cellSize = 2;
        const halfGrid = gridSize / 2;
        
        // On définit 4 axes pour créer un grand carré central (comme ton image cible)
        const axesPos = [-10, 10]; 

        const addRoad = (id: string, modelKey: string, pos: [number, number, number], rot: number = 0) => {
            const path = (ROAD_MODELS as any)[modelKey];
            if (path) elements.push({ id, path, pos, rot });
        };

        axesPos.forEach(fixed => {
            for (let i = -halfGrid; i <= halfGrid; i += cellSize) {
                const isCross = axesPos.includes(i);
                // Routes horizontales
                addRoad(`h-${i}-${fixed}`, isCross ? 'crossroad-path' : 'straight', [i, 0, fixed], Math.PI / 2);
                // Routes verticales (on évite de doubler les intersections)
                if (!isCross) {
                    addRoad(`v-${fixed}-${i}`, 'straight', [fixed, 0, i], 0);
                }
            }
        });
        return elements;
    }, [gridSize]);

    return (
        <group>
            {roadElements.map((el) => (
                <group key={el.id}>
                    <GLBModel path={el.path} position={el.pos} rotation={[0, el.rot, 0]} scale={[2, 2, 2]} />
                    
                    {/* RÉACTIVATION DU JOUR/NUIT : Lumières de ville */}
                    {isNight && el.id.includes('h-') && Math.abs(el.pos[0]) % 6 === 0 && (
                        <pointLight position={[el.pos[0], 1.5, el.pos[2]]} intensity={8} distance={6} color="#00f2ff" />
                    )}
                </group>
            ))}
        </group>
    );
}