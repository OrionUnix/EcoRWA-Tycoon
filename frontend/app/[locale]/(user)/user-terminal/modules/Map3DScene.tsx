'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Suspense } from 'react';


export function Map3DScene() {
  return (
    <div className="w-full h-full bg-[#010204]">
      <Canvas gl={{ antialias: true }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={30} />
          <OrbitControls
            maxPolarAngle={Math.PI / 2.3}
            minDistance={10}
            maxDistance={40}
            autoRotate
            autoRotateSpeed={0.3}
          />

          <color attach="background" args={['#010204']} />
          <fog attach="fog" args={['#010204', 20, 50]} />



          {/* Exemple de bâtiment "Data-Point" */}
          <mesh position={[2, 1, -2]}>
            <boxGeometry args={[0.5, 2, 0.5]} />
            <meshBasicMaterial color="#00f2ff" wireframe />
          </mesh>

          {/* Effet de Halo (Glow) pour le look Cyber */}
          <EffectComposer>
            <Bloom intensity={1.5} luminanceThreshold={0.1} mipmapBlur />
          </EffectComposer>

        </Suspense>
      </Canvas>
    </div>
  );
}