'use client';

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Sky, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Toolbar from '@/components/editor/Toolbar';

const CityEditor = dynamic(() => import('@/components/zones/cityeditor'), {
    ssr: false,
    loading: () => null
});

export default function EditorPage() {
    const [selectedTool, setSelectedTool] = useState<string | null>(null);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020617' }}>
            <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />

            <Canvas 
               shadows 
    gl={{ 
antialias: true, 
        toneMapping: THREE.AgXToneMapping, // AgX est souvent meilleur pour les couleurs saturées que ACES
        toneMappingExposure: 0.7 // Réduit l'éblouissement "tout blanc"
    }}
>
                <OrbitControls makeDefault />

              {/* Lumière ambiante très douce pour ne pas "brûler" les blancs */}
    <ambientLight intensity={0.3} /> 

    <directionalLight 
        position={[40, 60, 40]}
        intensity={1.2} // On baisse l'intensité
        castShadow 
        
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002} // SUPPRIME LES ARTEFACTS SUR LES FAÇADES
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        />

                {/* 2. Le Soleil : on baisse l'intensité pour ne pas brûler les blancs */}
                <directionalLight 
                    position={[50, 80, 50]} 
                    intensity={0.8} 
                    castShadow 
                    shadow-mapSize={[2048, 2048]}
                    shadow-camera-left={-60}
                    shadow-camera-right={60}
                    shadow-camera-top={60}
                    shadow-camera-bottom={-60}
                    shadow-bias={-0.0005} 
                />

                {/* 3. Lumière d'appoint pour adoucir sans surexposer */}
                <hemisphereLight intensity={0.3} color="#ffffff" groundColor="#444444" />

                {/* 4. Pour les reflets (très important pour le look "maquette") */}
                <Environment preset="apartment" />

                <Suspense fallback={null}>
                    <CityEditor mode={selectedTool} />
                </Suspense>
                
                {/* 5. Contact Shadows pour l'ancrage au sol */}
                <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={100} blur={2} />
            </Canvas>
        </div>
    );
}