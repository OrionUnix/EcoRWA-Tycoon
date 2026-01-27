'use client';

import React, { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Désactivation stricte du SSR pour le composant Three.js
const CityEditor = dynamic(() => import('@/components/zones/cityeditor'), {
    ssr: false,
    loading: () => null
});

export default function EditorPage() {
    const [selectedTool, setSelectedTool] = useState<string | null>(null);

    const btnStyle = (active: boolean, del = false) => ({
        width: '100%',
        padding: '12px',
        marginBottom: '8px',
        borderRadius: '8px',
        cursor: 'pointer',
        border: 'none',
        fontWeight: 'bold' as const,
        backgroundColor: active ? (del ? '#ef4444' : '#3b82f6') : '#1e293b',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s'
    });

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020617' }}>
            {/* UI Layer */}
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 10,
                width: '200px',
                padding: '15px',
                background: 'rgba(15,23,42,0.9)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
            }}>
                <button onClick={() => setSelectedTool('ROAD')} style={btnStyle(selectedTool === 'ROAD')}>
                    🛣️ Route
                </button>
                <button onClick={() => setSelectedTool('DELETE')} style={btnStyle(selectedTool === 'DELETE', true)}>
                    🚜 Bulldozer
                </button>

                <hr style={{ border: '0.5px solid #334155', margin: '15px 0' }} />

                <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.6' }}>
                    <p><strong>Contrôles :</strong></p>
                    <p>⌨️ ZQSD : Déplacement</p>
                    <p>⌨️ A / E : Rotation</p>
                    <p>🖱️ Molette : Zoom</p>
                    <p style={{ marginTop: '10px', color: '#3b82f6' }}>Mode actuel : {selectedTool || 'Aucun'}</p>
                </div>
            </div>

            {/* 3D Layer */}
            <Canvas shadows camera={{ position: [30, 30, 30], fov: 45 }}>
                {/* CONFIG ORBITCONTROLS :
                    On désactive la rotation et le déplacement (Pan) à la souris
                    car ils sont maintenant gérés par le clavier (CameraRig).
                    On garde uniquement le Zoom.
                */}
                <OrbitControls
                    makeDefault
                    enableRotate={false}
                    enablePan={false}
                    enableZoom={true}
                    minDistance={5}
                    maxDistance={150}
                />

                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />

                <Suspense fallback={null}>
                    <CityEditor mode={selectedTool} />
                </Suspense>
            </Canvas>
        </div>
    );
}