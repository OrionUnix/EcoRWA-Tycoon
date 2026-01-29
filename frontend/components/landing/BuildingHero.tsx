'use client';
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment, Float } from '@react-three/drei';
import { MapPin, TrendingUp } from 'lucide-react';
import * as THREE from 'three';

// Configuration du chemin selon l'environnement
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/EcoRWA-Tycoon' : '';
const MODEL_PATH = `${basePath}/assets/models/suburban/building-type-o.glb`;

function Model() {
  // On utilise le chemin calculé dynamiquement
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
  const responsiveScale = Math.min(viewport.width * 0.85, 5.8);
  const responsivePosY = -(responsiveScale * 0.5); // Ajusté pour centrer le building

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Animation douce de rotation + suivi de souris
    const targetRotationY = (state.clock.elapsedTime * 0.1) + (state.mouse.x * 0.2);
    
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, 
      targetRotationY, 
      0.05 
    );
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={responsiveScale} position-y={responsivePosY} /> 
      <ContactShadows 
        position={[0, responsivePosY, 0]} 
        opacity={0.4} 
        scale={20} 
        blur={2.5} 
      />
    </group>
  );
}

export default function BuildingHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  if (!mounted) return <div className="w-full h-full bg-[#020617]" />;

  return (
    <div className="relative w-full h-full overflow-visible">
      <Canvas 
        shadows
        dpr={[1, 2]} // Optimisation performance
        gl={{ 
          antialias: true, 
          powerPreference: "high-performance",
          alpha: true 
        }}
        camera={{ position: [0, 2, 12], fov: 35 }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <Environment preset="city" />
        
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
              <Model />
          </Float>
        </Suspense>
      </Canvas>

      {/* Badge Info */}
      <div className="absolute bottom-12 lg:bottom-20 left-0 w-full z-50 flex justify-center px-4 pointer-events-none">
        <div className="flex flex-col md:flex-row items-center gap-3 px-6 py-4 bg-black/60 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl">
          <div className="flex items-center gap-2 pr-0 md:pr-5 md:border-r border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white font-bold tracking-tight">Résidence Loft-O</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-sm font-semibold">
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-400" /> Parse City</span>
            <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-blue-400" /> Yield: 7.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preload pour éviter le lag au montage
useGLTF.preload(MODEL_PATH);