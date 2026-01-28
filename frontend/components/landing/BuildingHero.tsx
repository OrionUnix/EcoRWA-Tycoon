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
  
  // Calcul automatique : max 5.5 sur desktop, réduit proportionnellement sur mobile
  const responsiveScale = Math.min(viewport.width * 0.7, 5.5);
  const responsivePosY = -(responsiveScale * 1.1);

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
      {/* Ombre dynamique placée exactement sous les pieds du modèle */}
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

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="relative w-full h-[550px] lg:h-[750px] flex flex-col items-center justify-end overflow-hidden">
      <div className="absolute inset-0 w-full h-full"> 
        <Canvas 
          shadows 
          camera={{ position: [0, 2, 18], fov: 40 }} 
          gl={{ alpha: true, antialias: true }}
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
      </div>

      {/* Étiquette Apple Style */}
      <div className="relative z-10 mb-12 flex flex-col items-center w-full px-4 pointer-events-none">
        <div className="flex flex-col md:flex-row items-center gap-3 px-6 py-4 bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl">
          <div className="flex items-center gap-2.5 pr-0 md:pr-5 md:border-r border-white/10 pb-2 md:pb-0">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.7)]" />
            <span className="text-[13px] md:text-[15px] font-bold text-white tracking-tight">Résidence Loft-O</span>
          </div>
          <div className="flex items-center gap-6 text-slate-300 text-[11px] md:text-[12px] font-semibold">
            <span className="flex items-center gap-2 opacity-90"><MapPin className="w-4 h-4 text-blue-400" /> Parse City</span>
            <span className="flex items-center gap-2 opacity-90"><TrendingUp className="w-4 h-4 text-blue-400" /> Yield: 7.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}