'use client';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls } from '@react-three/drei';
import VillaHero from './VillaHero';

export default function Hero3D() {
  return (
    // On force la taille avec h-screen et w-full
    <div className="fixed inset-0 -z-10 w-full h-screen bg-[#020617]">
      <Suspense fallback={<div className="text-white p-10">Chargement 3D...</div>}>
        <Canvas
          shadows
          dpr={[1, 1.5]} // Limite la résolution pour la performance
          camera={{ position: [12, 10, 12], fov: 35 }}
        >
          <color attach="background" args={['#020617']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />

          <VillaHero />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}