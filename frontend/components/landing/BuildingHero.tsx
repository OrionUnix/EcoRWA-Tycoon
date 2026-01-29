'use client';
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment, Float } from '@react-three/drei';
import { MapPin, TrendingUp } from 'lucide-react';
import * as THREE from 'three';

const MODEL_PATH = '/assets/models/suburban/building-type-o.glb';
useGLTF.preload(MODEL_PATH);

function Model() {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
  const responsiveScale = Math.min(viewport.width * 0.85, 5.8);
  const responsivePosY = -(responsiveScale * 1.1); 

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Calcul et application dans le même scope pour éviter l'erreur de Runtime
    const targetRotationY = (state.clock.elapsedTime * 0.1) + (state.mouse.x * 0.5);
    
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, 
      targetRotationY, 
      0.1 
    );
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={responsiveScale} position-y={responsivePosY} /> 
      <ContactShadows 
        position={[0, responsivePosY + 0.05, 0]} 
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

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full overflow-visible">
      <Canvas 
        shadows="basic" 
        dpr={1.2} 
        gl={{ 
          antialias: false, 
          powerPreference: "high-performance",
          stencil: false,
          alpha: true 
        }}
        camera={{ position: [0, 4, 18], fov: 40 }}
      >
        <ambientLight intensity={1.6} />
        <Environment preset="city" />
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
             <Model />
          </Float>
        </Suspense>
      </Canvas>

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