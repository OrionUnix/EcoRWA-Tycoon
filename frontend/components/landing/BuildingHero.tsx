'use client';
import React, { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, ContactShadows, Environment, Float, PerspectiveCamera } from '@react-three/drei';
import { MapPin } from 'lucide-react';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/EcoRWA-Tycoon' : '';
const MODEL_PATH = `${basePath}/assets/models/suburban/loft-saint-germain.glb`;

function Model() {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // On calcule l'échelle ici, une seule fois
  const responsiveScale = Math.min(viewport.width * 0.5, 0.05);

  useMemo(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMapIntensity = 2.5; 
          child.material.roughness = 0.15;
          child.material.metalness = 0.8; 
          
          if (child.name.toLowerCase().includes('window') || child.name.toLowerCase().includes('glass')) {
            child.material.emissive = new THREE.Color('#ffffff'); 
            child.material.emissiveIntensity = 20;
          }
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const targetRotationY = (state.clock.elapsedTime * 0.1) + (state.mouse.x * 0.15);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.04);
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}> 
      <primitive object={scene} scale={responsiveScale} />
      <ContactShadows opacity={0.3} scale={20} blur={2.5} far={4.5} />
    </group>
  );
}

export default function BuildingHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full bg-transparent">
      <Canvas 
        shadows
        gl={{ preserveDrawingBuffer: true, alpha: true }}
        className="overflow-visible"
      >
        <PerspectiveCamera makeDefault position={[0, 2, 9]} fov={20} />
        
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={3} />
        <pointLight position={[-10, 5, -5]} color="#3b82f6" intensity={5} />
        <Environment preset="city" /> 

        <Suspense fallback={null}>
          <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
            <Model />
          </Float>
          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={1.0} mipmapBlur intensity={1.2} radius={0.3} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Badge repositionné à droite pour suivre le building */}
      <div className="absolute bottom-75 left-1/2 -translate-x-1/2 lg:left-auto lg:right-10 z-50 pointer-events-none">
        <div className="flex items-center gap-6 px-6 py-3 bg-white/[0.02] backdrop-blur-2xl rounded-full shadow-2xl border border-white/10 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-[11px] font-bold tracking-widest uppercase italic">Loft Saint-Germain</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-3 text-white/50 text-[10px] font-medium">
             <MapPin size={12} className="text-blue-400" />
             <span className="text-emerald-400 font-bold">+4.0% APY</span>
          </div>
        </div>
      </div>
    </div>
  );
}