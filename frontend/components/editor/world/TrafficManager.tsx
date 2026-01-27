'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import GLBModel from '@/components/zones/GLBModel';

interface Vehicle {
    id: number;
    type: 'SUV' | 'DELIVERY' | 'TAXI' | 'TRUCK';
    model: string;
    position: THREE.Vector3;
    target: THREE.Vector3 | null;
    lastPosKey: string; // Pour éviter de bégayer sur la même case
    status: 'MOVING' | 'WAITING' | 'IDLE';
    hasBox: boolean;
    waitTimer: number;
    rotationY: number;
}

export default function TrafficManager({ roads, zones, props, isNight }: any) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (roads.size === 0 || isInitialized.current) return;

        const types: Vehicle['type'][] = ['SUV', 'SUV', 'DELIVERY', 'TAXI', 'TRUCK', 'TRUCK', 'SUV', 'DELIVERY', 'TAXI', 'TRUCK'];
        const roadKeys = Array.from(roads.keys());

        const initialVehicles = types.map((type, i) => {
            const startRoadKey = roadKeys[Math.floor(Math.random() * roadKeys.length)];
            const [sx, sz] = startRoadKey.split(',').map(Number);

            let modelFile = 'vehicle.glb';
            if (type === 'SUV') modelFile = Math.random() > 0.5 ? 'suv.glb' : 'suv-luxury.glb';
            else if (type === 'DELIVERY') modelFile = 'delivery.glb';
            else if (type === 'TAXI') modelFile = 'taxi.glb';
            else if (type === 'TRUCK') modelFile = 'truck.glb';

            return {
                id: i,
                type,
                model: modelFile,
                position: new THREE.Vector3(sx, 0, sz),
                target: null,
                lastPosKey: startRoadKey,
                status: 'IDLE' as const,
                hasBox: false,
                waitTimer: 0,
                rotationY: 0
            };
        });

        setVehicles(initialVehicles);
        isInitialized.current = true;
    }, [roads.size]);

    useFrame((_, delta) => {
        if (roads.size === 0) return;

        setVehicles(prev => prev.map(v => {
            let newV = { ...v };

            // 1. LOGIQUE DE NAVIGATION
            if (newV.status === 'IDLE') {
                const currentX = Math.round(newV.position.x);
                const currentZ = Math.round(newV.position.z);
                const currentKey = `${currentX},${currentZ}`;

                const neighbors = [
                    { x: currentX + 2, z: currentZ },
                    { x: currentX - 2, z: currentZ },
                    { x: currentX, z: currentZ + 2 },
                    { x: currentX, z: currentZ - 2 }
                ];

                // Filtrer les routes valides
                const validRoads = neighbors.filter(n => roads.has(`${n.x},${n.z}`));

                if (validRoads.length > 0) {
                    // Priorité : Ne pas retourner sur la case précédente (évite le blocage local)
                    const forwardOptions = validRoads.filter(n => `${n.x},${n.z}` !== newV.lastPosKey);
                    const nextStep = forwardOptions.length > 0 
                        ? forwardOptions[Math.floor(Math.random() * forwardOptions.length)]
                        : validRoads[0]; // Demi-tour forcé si cul-de-sac

                    newV.target = new THREE.Vector3(nextStep.x, 0, nextStep.z);
                    newV.lastPosKey = currentKey;
                    newV.status = 'MOVING';
                }
            }

            // 2. MOUVEMENT
            if (newV.status === 'MOVING' && newV.target) {
                const dist = newV.position.distanceTo(newV.target);
                
                if (dist > 0.1) {
                    const dir = newV.target.clone().sub(newV.position).normalize();
                    newV.position.add(dir.multiplyScalar(delta * 4));
                    newV.rotationY = Math.atan2(dir.x, dir.z);
                } else {
                    newV.status = 'WAITING';
                    newV.waitTimer = 0.2; // Pause très courte pour fluidifier
                    
                    if (newV.type === 'TRUCK' && Math.random() > 0.9) {
                        newV.hasBox = !newV.hasBox;
                        newV.waitTimer = 1.5;
                    }
                }
            }

            if (newV.status === 'WAITING') {
                newV.waitTimer -= delta;
                if (newV.waitTimer <= 0) newV.status = 'IDLE';
            }

            return newV;
        }));
    });

    return (
        <group>
            {vehicles.map((v) => (
                <group 
                    key={v.id} 
                    position={[v.position.x, 0, v.position.z]} 
                    rotation={[0, v.rotationY, 0]}
                >
                    <GLBModel path={`/assets/models/vehicles/${v.model}`} scale={[0.6, 0.6, 0.6]} />
                    {v.type === 'TRUCK' && v.hasBox && (
                        <group position={[0, 0.4, 0]}>
                            <GLBModel path="/assets/models/vehicles/box.glb" scale={[0.4, 0.4, 0.4]} />
                        </group>
                    )}
                    {isNight && (
                        <pointLight position={[0, 0.3, 0.6]} intensity={1.5} color="#fff8e1" distance={4} />
                    )}
                </group>
            ))}
        </group>
    );
}