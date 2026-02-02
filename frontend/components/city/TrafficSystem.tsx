'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const VEHICLE_MODELS = [
    '/assets/models/vehicles/taxi.glb',
    '/assets/models/vehicles/suv.glb',
    '/assets/models/vehicles/truck.glb',
    '/assets/models/vehicles/van.glb',
    '/assets/models/vehicles/delivery.glb'
];

interface TrafficSystemProps {
    isNight: boolean;
    cityScene: THREE.Group;
}

export default function TrafficSystem({ isNight, cityScene }: TrafficSystemProps) {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [roadCurve, setRoadCurve] = useState<THREE.CatmullRomCurve3 | null>(null);

    // Extract road path from GLB road objects
    useEffect(() => {
        if (!cityScene) return;

        const roadPoints: THREE.Vector3[] = [];
        const roadObjects: any[] = [];

        // Scan for road objects
        cityScene.traverse((child: any) => {
            if (child.name && child.name.toLowerCase().includes('road_')) {
                roadObjects.push({
                    name: child.name,
                    position: child.getWorldPosition(new THREE.Vector3())
                });
            }
        });

        console.log(`🛣️ Found ${roadObjects.length} road segments`);

        if (roadObjects.length > 0) {
            // Sort roads to create a coherent path
            // Create a rectangular path following the outer roads
            const sortedRoads = roadObjects.sort((a, b) => {
                const angleA = Math.atan2(a.position.z, a.position.x);
                const angleB = Math.atan2(b.position.z, b.position.x);
                return angleA - angleB;
            });

            // Sample points from sorted roads
            const sampleEvery = Math.max(1, Math.floor(sortedRoads.length / 16));
            for (let i = 0; i < sortedRoads.length; i += sampleEvery) {
                const pos = sortedRoads[i].position.clone();
                pos.y = 0.1; // Slightly above ground
                roadPoints.push(pos);
            }
        }

        // Fallback to rectangular path if no roads found
        if (roadPoints.length < 4) {
            console.log('⚠️ Using fallback rectangular path');
            roadPoints.length = 0;
            roadPoints.push(
                new THREE.Vector3(-35, 0.1, -25),
                new THREE.Vector3(35, 0.1, -25),
                new THREE.Vector3(35, 0.1, 25),
                new THREE.Vector3(-35, 0.1, 25)
            );
        }

        const curve = new THREE.CatmullRomCurve3(roadPoints, true, 'catmullrom', 0.5);
        setRoadCurve(curve);

        // Initialize vehicles
        const initialVehicles = new Array(10).fill(0).map((_, i) => ({
            id: i,
            modelPath: VEHICLE_MODELS[i % VEHICLE_MODELS.length],
            progress: i / 10,
            baseSpeed: 0.01 + Math.random() * 0.01,
        }));
        setVehicles(initialVehicles);

    }, [cityScene]);

    if (!roadCurve) return null;

    return (
        <group>
            {vehicles.map((v) => (
                <Vehicle
                    key={v.id}
                    vData={v}
                    curve={roadCurve}
                    allVehicles={vehicles}
                    isNight={isNight}
                />
            ))}
        </group>
    );
}

function Vehicle({ vData, curve, allVehicles, isNight }: any) {
    const gltf = useGLTF(vData.modelPath) as any;
    const scene = gltf?.scene;
    const carRef = useRef<THREE.Group>(null);
    const spotlightRef = useRef<THREE.SpotLight>(null);
    const [progress, setProgress] = useState(vData.progress);

    const model = useMemo(() => {
        if (!scene) return null;
        const cloned = scene.clone();
        cloned.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return cloned;
    }, [scene]);

    useFrame((_, delta) => {
        if (!carRef.current) return;

        // Anti-collision logic
        let currentSpeed = vData.baseSpeed;
        allVehicles.forEach((other: any) => {
            if (other.id === vData.id) return;
            let dist = other.progress - progress;
            if (dist < 0) dist += 1;
            if (dist < 0.12) currentSpeed *= 0.2;
        });

        // Update progress
        const nextProgress = (progress + currentSpeed * delta) % 1;
        setProgress(nextProgress);
        vData.progress = nextProgress;

        // Position and orientation
        const pos = curve.getPointAt(nextProgress);
        const tangent = curve.getTangentAt(nextProgress);

        carRef.current.position.copy(pos);

        // Look ahead along the path
        const lookAheadPos = pos.clone().add(tangent.multiplyScalar(2));
        carRef.current.lookAt(lookAheadPos);

        // Headlights at night
        if (spotlightRef.current) {
            spotlightRef.current.intensity = isNight ? 30 : 0;
        }
    });

    return (
        <group ref={carRef}>
            <primitive
                object={model}
                scale={0.7}
                position={[0, 0, 0]}
            />

            {/* Front headlights */}
            <spotLight
                ref={spotlightRef}
                position={[0, 0.5, 1.5]}
                angle={0.5}
                intensity={30}
                distance={15}
                penumbra={0.5}
                castShadow={false}
            />
        </group>
    );
}