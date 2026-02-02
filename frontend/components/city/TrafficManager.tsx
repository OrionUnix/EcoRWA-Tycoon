'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Liste de tes modèles réels présents dans le dossier public
const VEHICLE_MODELS = [
    '/assets/models/vehicles/taxi.glb',
    '/assets/models/vehicles/suv.glb',
    '/assets/models/vehicles/truck.glb',
    '/assets/models/vehicles/van.glb',
    '/assets/models/vehicles/delivery.glb'
];

export default function TrafficManager({ cityScene, isNight }: { cityScene: THREE.Group, isNight: boolean }) {
    const [vehicles, setVehicles] = useState<any[]>([]);

    // Création de la trajectoire basée sur les noms "road_xxx" vus dans tes captures
    const roadCurve = useMemo(() => {
        // Ces points créent un grand rectangle qui suit les boulevards extérieurs
        // Ajustez les valeurs 85 et 65 selon la taille réelle de votre bloc city
        const points = [
            new THREE.Vector3(-85, 0.1, -65), // Coin arrière gauche
            new THREE.Vector3(85, 0.1, -65),  // Coin arrière droit
            new THREE.Vector3(85, 0.1, 65),   // Coin avant droit
            new THREE.Vector3(-85, 0.1, 65),  // Coin avant gauche
        ];

        // CatmullRomCurve3 avec 'centripetal' permet des virages plus naturels
        return new THREE.CatmullRomCurve3(points, true, 'centripetal');
    }, []);

    // Initialisation des véhicules
    useEffect(() => {
        const initialVehicles = new Array(12).fill(0).map((_, i) => ({
            id: i,
            modelPath: VEHICLE_MODELS[i % VEHICLE_MODELS.length],
            progress: i / 12, // Espacement initial régulier
            speed: 0.015 + Math.random() * 0.01,
            baseSpeed: 0.015 + Math.random() * 0.01,
        }));
        setVehicles(initialVehicles);
    }, []);

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
    // 🛠️ FIX TYPESCRIPT: On force le type 'any' sur le résultat de useGLTF
    const gltf = useGLTF(vData.modelPath) as any;

    // On extrait la scène en toute sécurité
    const scene = gltf?.scene;

    const carRef = useRef<THREE.Group>(null);
    const spotlightRef = useRef<THREE.SpotLight>(null);
    const [progress, setProgress] = useState(vData.progress);

    // Initialisation du modèle cloné
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

    useFrame((state, delta) => {
        if (!carRef.current || !model) return;

        let currentSpeed = vData.baseSpeed;
        allVehicles.forEach((other: any) => {
            if (other.id === vData.id) return;
            let dist = other.progress - progress;
            if (dist < 0) dist += 1;
            if (dist < 0.12) currentSpeed *= 0.2;
        });

        const nextProgress = (progress + currentSpeed * delta) % 1;
        setProgress(nextProgress);
        vData.progress = nextProgress;

        const pos = curve.getPointAt(nextProgress);
        const nextPos = curve.getPointAt((nextProgress + 0.01) % 1);

        carRef.current.position.copy(pos);
        carRef.current.lookAt(nextPos);

        if (spotlightRef.current) {
            spotlightRef.current.intensity = isNight ? 40 : 0;
        }
    });

    if (!model) return null;

    return (
        <group ref={carRef}>
            <primitive
                object={model}
                scale={0.7}
                rotation={[0, Math.PI, 0]}
            />
            {isNight && (
                <spotLight
                    ref={spotlightRef}
                    position={[0, 0.5, 1]}
                    angle={0.5}
                    intensity={20}
                    distance={15}
                />
            )}
        </group>
    );
}