'use client';
import { Canvas } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment, Float, Center, Preload } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';

const MODEL_PATH = '/assets/models/suburban/building-type-o.glb';

// On pré-charge le modèle pour éviter le crash au F5 sur Chrome
useGLTF.preload(MODEL_PATH);

function Model() {
  const { scene } = useGLTF(MODEL_PATH);
  return <primitive object={scene} scale={2.5} />;
}

export default function BuildingHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      <Canvas 
        shadows 
        camera={{ position: [8, 4, 12], fov: 35 }}
        // Toujours alpha: true pour la transparence
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <ambientLight intensity={0.7} />
        <Environment preset="city" />
        
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <Center top>
              <directionalLight position={[5, 10, 5]} intensity={2.5} castShadow />
              <Model />
            </Center>
          </Float>
          {/* Ombre portée pour l'intégration visuelle */}
          <ContactShadows position={[0, -0.01, 0]} opacity={0.2} scale={10} blur={3} />
        </Suspense>
        
        {/* Force le moteur à garder les ressources en mémoire */}
        <Preload all />
      </Canvas>
    </div>
  );
}