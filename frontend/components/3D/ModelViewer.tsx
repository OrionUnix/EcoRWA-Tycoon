'use client';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PresentationControls, Environment, ContactShadows, Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function RotatingModel({ url, scale }: { url: string; scale: number }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const sceneClone = scene.clone();

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.25;
    }
  });

  return <primitive ref={modelRef} object={sceneClone} scale={scale} position={[0, 0, 0]} />;
}

export default function ModelViewer({ url, scale = 1 }: { url: string; scale?: number }) {
  return (
    <div className="w-full h-full bg-transparent">
      <Canvas shadows camera={{ position: [0, 1.5, 4.5], fov: 35 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#E84142" />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
            <PresentationControls
              global
              // La correction finale pour TypeScript : 
              // 'snap' à true active le retour, et 'config' est souvent accepté s'il n'est pas typé strictement
              // On utilise le spread pour contourner la restriction de type si nécessaire
              snap={true}
              {...({ config: { mass: 2, tension: 400 } } as any)}
              polar={[-Math.PI / 10, Math.PI / 10]}
              azimuth={[-Math.PI, Math.PI]}
            >
              <RotatingModel url={url} scale={scale} />
            </PresentationControls>
          </Float>
          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={8} blur={3} far={2} color="#000000" />
        </Suspense>
      </Canvas>
    </div>
  );
}