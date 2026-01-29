'use client';
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment, Float, Center } from '@react-three/drei';
import { MapPin, TrendingUp } from 'lucide-react';
import * as THREE from 'three';

const MODEL_PATH = '/assets/models/suburban/building-type-o.glb';

function Model() {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const autoRotationRef = useRef(0);
  const { viewport } = useThree();
  
  const responsiveScale = Math.min(viewport.width * 0.7, 4.5);
  const responsivePosY = -(responsiveScale * 0.5);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    autoRotationRef.current += delta * 0.15;
    const { x, y } = state.mouse;

    const targetRotationY = autoRotationRef.current + (x * 0.35);
    const targetRotationX = -y * 0.1;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.05);
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={responsiveScale} position-y={responsivePosY} /> 
      <ContactShadows 
        position={[0, responsivePosY, 0]} 
        opacity={0.4} 
        scale={25} 
        blur={2.5} 
        far={10} 
      />
    </group>
  );
}

export default function BuildingHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    // On ne met pas de code de nettoyage lourd ici car @react-three/fiber 
    // gère déjà le nettoyage du renderer automatiquement.
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center lg:justify-end overflow-hidden">
      <Canvas 
       shadows 
  dpr={[1, 1.5]} // Limite la résolution sur les écrans haute densité (iPhone)
  camera={{ position: [0, 2, 18], fov: 40 }}
        gl={{ 
alpha: true, 
    antialias: false, // Désactiver l'antialias économise beaucoup de mémoire
    powerPreference: "high-performance"
        }}
        // Sécurité pour la perte de contexte
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
        }}
      >
        <ambientLight intensity={1.2} />
        <pointLight position={[10, 15, 10]} intensity={2} />
        <Environment preset="city" />
        
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
            <Center bottom>
              <Model />
            </Center>
          </Float>
        </Suspense>
      </Canvas>

      {/* Étiquette : Ajustée pour le mobile (moins haute pour ne pas chevaucher) */}
      <div className="absolute bottom-6 md:bottom-12 z-10 flex flex-col items-center w-full px-4 pointer-events-none">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 bg-black/40 border border-white/10 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl">
          <div className="flex items-center gap-2 pr-0 md:pr-5 md:border-r border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs md:text-[15px] font-bold text-white tracking-tight">Résidence Loft-O</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-[10px] md:text-[12px] font-semibold">
            <span className="flex items-center gap-1.5 opacity-90"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Parse City</span>
            <span className="flex items-center gap-1.5 opacity-90"><TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Yield: 7.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}