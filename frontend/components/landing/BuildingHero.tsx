'use client';
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment, Float } from '@react-three/drei';
import { MapPin, TrendingUp } from 'lucide-react';
import * as THREE from 'three';

const MODEL_PATH = '/assets/models/suburban/building-type-o.glb';

function Model() {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
  // Scale stabilisé à 4.8 pour ne pas "manger" toute la page
  const responsiveScale = Math.min(viewport.width * 0.85, 5.8);
  
  // On descend le point d'ancrage pour que le bas de la maison soit près de l'étiquette
  const responsivePosY = -(responsiveScale * 0.5); 

  useFrame((state) => {
    if (!groupRef.current) return;
    const { x } = state.mouse;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, 
      (state.clock.elapsedTime * 0.1) + (x * 0.45), 
      0.05
    );
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={responsiveScale} position-y={responsivePosY} /> 
      <ContactShadows position={[0, responsivePosY, 0]} opacity={0.4} scale={15} blur={2.5} />
    </group>
  );
}

export default function BuildingHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="relative w-full h-full overflow-visible">
      <Canvas 
        shadows 
        dpr={[1, 1.5]}
        camera={{ position: [0, 4, 18], fov: 40 }} // Caméra légèrement plus proche (18 au lieu de 20)
        gl={{ alpha: true, antialias: false }}
      >
        <ambientLight intensity={1.6} />
        <Environment preset="city" />
        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
             <Model />
          </Float>
        </Suspense>
      </Canvas>

      {/* Étiquette : On la remonte avec bottom-12 ou 20 pour qu'elle soit bien visible */}
      <div className="absolute bottom-12 lg:bottom-20 left-0 w-full z-50 flex justify-center px-4 pointer-events-none">
        <div className="flex flex-col md:flex-row items-center gap-3 px-6 py-4 bg-black/60 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl">
          <div className="flex items-center gap-2 pr-5 border-r border-white/10">
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
