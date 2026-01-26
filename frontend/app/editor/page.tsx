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
        width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '8px',
        cursor: 'pointer', border: 'none', fontWeight: 'bold' as const,
        backgroundColor: active ? (del ? '#ef4444' : '#3b82f6') : '#1e293b',
        color: 'white'
    });

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#020617' }}>
            {/* UI Layer */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, width: '200px', padding: '15px', background: 'rgba(15,23,42,0.8)', borderRadius: '12px' }}>
                <button onClick={() => setSelectedTool('ROAD')} style={btnStyle(selectedTool === 'ROAD')}>🛣️ Route</button>
                <button onClick={() => setSelectedTool('DELETE')} style={btnStyle(selectedTool === 'DELETE', true)}>🚜 Bulldozer</button>
                <p style={{ color: 'gray', fontSize: '12px', marginTop: '10px' }}>Mode: {selectedTool || 'Aucun'}</p>
            </div>

            {/* 3D Layer */}
            <Canvas shadows camera={{ position: [30, 30, 30], fov: 45 }}>
                <OrbitControls makeDefault />
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} />

                <Suspense fallback={null}>
                    {/* Le mode est passé ici */}
                    <CityEditor mode={selectedTool} />
                </Suspense>
            </Canvas>
        </div>
    );
}