'use client';

import React, { Suspense, useState, useRef } from 'react'; // Ajout de useRef ici
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment as DreiEnvironment } from '@react-three/drei';
import * as THREE from 'three';
import Toolbar from '@/components/editor/Toolbar';
import CustomEnvironment from '@/components/editor/world/Environment';

const CityEditor = dynamic(() => import('@/components/zones/cityeditor'), { ssr: false });

export default function EditorPage() {
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [isNight, setIsNight] = useState(false);
    
    // Le useRef doit être à l'intérieur du composant
    const controlsRef = useRef<any>(null);

    // La fonction de reset aussi
    const resetCamera = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020617' }}>
            <Toolbar 
                selectedTool={selectedTool} 
                setSelectedTool={setSelectedTool} 
                isNight={isNight} 
                setIsNight={setIsNight} 
            />

            <Canvas 
shadows 
  gl={{ 
    powerPreference: "high-performance", // Force l'usage de la carte graphique
    antialias: false, // Désactiver l'antialias gagne bcp de FPS sur les petits écrans
    stencil: false,
    depth: true
  }}
            >
                {/* Effet de brouillard pour masquer les bords */}
                <fog attach="fog" args={[isNight ? '#020617' : '#87ceeb', 30, 150]} />
                
                <OrbitControls 
                    makeDefault 
                    ref={controlsRef}
                    maxDistance={120} 
                    minDistance={10} 
                    maxPolarAngle={Math.PI / 2.1} 
                    target={[0, 0, 0]}
                />
                
                <CustomEnvironment isNight={isNight} />

                <group position={[0, 0.01, 0]}>
                    <gridHelper 
                        args={[100, 50, "#334155", "#1e293b"]} 
                        transparent 
                        opacity={0.4}
                    />
                </group>

                <Suspense fallback={null}>
                    <DreiEnvironment preset={isNight ? "night" : "city"} />
                    <CityEditor mode={selectedTool} isNight={isNight} />
                </Suspense>
                
                <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={100} blur={2} />
            </Canvas>
        </div>
    );
}