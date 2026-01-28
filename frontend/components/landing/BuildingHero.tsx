'use client';
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment, Float, Center } from '@react-three/drei';
import { RotateCcw, MapPin, TrendingUp } from 'lucide-react';
import * as THREE from 'three';

const MODEL_PATH = '/assets/models/suburban/building-type-o.glb';

function Model({ isRotating }: { isRotating: boolean }) {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  
  // On utilise une ref pour accumuler la rotation automatique
  const autoRotationRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (isRotating) {
      // Animation rapide déclenchée par le bouton 360°
      groupRef.current.rotation.y += delta * 2.5;
      autoRotationRef.current = groupRef.current.rotation.y; 
    } else {
      // 1. Rotation automatique très lente (environ 1 tour toutes le 30-40 secondes)
      autoRotationRef.current += delta * 0.15; 

      // 2. Récupération de la position de la souris
      const { x, y } = state.mouse;

      // 3. Combinaison : Rotation Auto + Influence de la souris (Parallax)
      // On utilise lerp pour que le mouvement soit fluide
      const targetRotationY = autoRotationRef.current + (x * 0.4);
      const targetRotationX = -y * 0.2;

      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y, 
        targetRotationY, 
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, 
        targetRotationX, 
        0.05
      );
    }
  });
  return (
<group ref={groupRef}>
 
      <primitive object={scene} scale={8} position-y={-10} /> 
    </group>
  );
}

export default function BuildingHero() {
  const [mounted, setMounted] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      
      {/* Le conteneur div a maintenant un padding-top pour décoller du haut de page.
          La caméra est baissée (y: 2) pour changer l'angle de vue.
      */}
      <div className="w-full h-[500px] lg:h-[600px] pt-12 lg:pt-20"> 
        <Canvas 
          shadows 
     camera={{ position: [0, 2, 16], fov: 45 }} 
  gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <Environment preset="city" />
          
          <Suspense fallback={null}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
              <Center top>
                <Model isRotating={isRotating} />
              </Center>
            </Float>
            {/* L'ombre doit rester au sol (0) même si le modèle descend */}
<ContactShadows 
  position={[0, -10, 0]} 
  opacity={0.4} 
  scale={40} // Augmenté pour couvrir la base d'un scale 8
  blur={2} 
/>

          </Suspense>
        </Canvas>
      </div>

      {/* Étiquette Apple Style - Positionnée avec une marge propre */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2 pr-4 border-r border-white/10">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[12px] font-bold text-white tracking-tight">Résidence Loft-O</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px] font-medium">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Parse City</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Yield: 7.2%</span>
          </div>
        </div>
        
        <button 
          onClick={() => { setIsRotating(true); setTimeout(() => setIsRotating(false), 2500); }}
          className="group flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5 transition-all"
        >

        </button>
      </div>
    </div>
  );
}