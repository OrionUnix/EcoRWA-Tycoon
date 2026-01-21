'use client';

import { useBuildingInfo } from '@/hooks/useBuildingInfo';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// --- SOUS-COMPOSANTS ---

function Building({ position, width, height, depth, color, owned, onClick }: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && owned) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={color} 
          emissive={owned ? color : '#000000'}
          emissiveIntensity={owned ? 0.3 : 0}
        />
      </mesh>
      <mesh position={[0, height / 2 + 0.2, 0]}>
        <boxGeometry args={[width * 1.1, 0.4, depth * 1.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {Array.from({ length: Math.floor(height / 1.5) }).map((_, floor) =>
        Array.from({ length: 3 }).map((_, col) => (
          <mesh key={`w-${floor}-${col}`} position={[(col - 1) * (width / 4), -height / 2 + floor * 1.5 + 0.5, depth / 2 + 0.01]}>
            <boxGeometry args={[0.4, 0.6, 0.02]} />
            <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.5} />
          </mesh>
        ))
      )}
    </group>
  );
}

function Car({ pathIndex }: { pathIndex: number }) {
  const carRef = useRef<THREE.Group>(null);
  const path = useMemo(() => [
    [[-15, 0, -8], [15, 0, -8]],
    [[-15, 0, 0], [15, 0, 0]],
    [[-8, 0, -15], [-8, 0, 15]],
    [[0, 0, -15], [0, 0, 15]],
  ][pathIndex % 4], [pathIndex]);

  useFrame((state) => {
    if (carRef.current) {
      const t = (state.clock.elapsedTime * 0.5 + pathIndex) % 1;
      carRef.current.position.x = THREE.MathUtils.lerp(path[0][0], path[1][0], t);
      carRef.current.position.z = THREE.MathUtils.lerp(path[0][2], path[1][2], t);
      carRef.current.rotation.y = Math.abs(path[0][0] - path[1][0]) > 1 ? 0 : Math.PI / 2;
    }
  });

  return (
    <group ref={carRef} position={[0, 0.2, 0]}>
      <mesh castShadow><boxGeometry args={[0.8, 0.4, 1.5]} /><meshStandardMaterial color="#ef4444" /></mesh>
    </group>
  );
}

function Cloud({ position, speed }: any) {
  const cloudRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (cloudRef.current) cloudRef.current.position.x = (state.clock.elapsedTime * speed) % 40 - 20;
  });
  return (
    <group ref={cloudRef} position={position}>
      {[0, 0.5, -0.5].map((offset, i) => (
        <mesh key={i} position={[offset, 0, 0]}>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Bird({ index }: { index: number }) {
  const birdRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (birdRef.current) {
      const t = state.clock.elapsedTime * 0.3 + index;
      birdRef.current.position.set(Math.sin(t) * 15, 10 + Math.sin(t * 2) * 2, Math.cos(t) * 15);
      birdRef.current.rotation.y = t;
    }
  });
  return (
    <mesh ref={birdRef}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}

function CityGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
      {[-8, 0, 8].map((z, i) => (
        <mesh key={`rh-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]} receiveShadow>
          <planeGeometry args={[40, 2]} /><meshStandardMaterial color="#374151" />
        </mesh>
      ))}
      {[-8, 0, 8].map((x, i) => (
        <mesh key={`rv-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]} receiveShadow>
          <planeGeometry args={[2, 40]} /><meshStandardMaterial color="#374151" />
        </mesh>
      ))}
    </group>
  );
}

// --- COMPOSANT PRINCIPAL ---

export default function ParseCity3D({ onBuildingClick }: { onBuildingClick: (b: any) => void }) {
  // Récupération des données blockchain
  const { building: b1 } = useBuildingInfo(1);
  const { building: b2 } = useBuildingInfo(2);
  const { building: b3 } = useBuildingInfo(3);

  const interactiveBuildings = useMemo(() => [
    { id: 1, name: b1?.name || 'Loft Saint-Germain', position: [-6, 3, -6], width: 2, height: 6, depth: 2, color: '#8B5CF6' },
    { id: 2, name: b2?.name || 'Le Bistrot Central', position: [0, 2.5, 0], width: 2.5, height: 5, depth: 2.5, color: '#F59E0B' },
    { id: 3, name: b3?.name || 'Eco-Tower 2030', position: [6, 4, 6], width: 3, height: 8, depth: 3, color: '#10B981' },
  ], [b1, b2, b3]);

  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-sky-300 to-sky-100 rounded-xl overflow-hidden relative shadow-inner">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[25, 25, 25]} fov={50} />
        <OrbitControls enablePan={false} minDistance={15} maxDistance={45} maxPolarAngle={Math.PI / 2.1} />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#60a5fa" />
        <fog attach="fog" args={['#87ceeb', 25, 60]} />

        <CityGround />

        {/* Bâtiments interactifs */}
        {interactiveBuildings.map((b) => (
          <Building key={b.id} {...b} onClick={() => onBuildingClick(b)} />
        ))}

        {/* Bâtiments décoratifs */}
        <Building position={[-10, 2, 4]} width={1.5} height={4} depth={1.5} color="#64748b" onClick={() => {}} />
        <Building position={[10, 3, -4]} width={2} height={6} depth={2} color="#475569" onClick={() => {}} />

        {/* Animations */}
        {[0, 1, 2, 3].map((i) => <Car key={`car-${i}`} pathIndex={i} />)}
        {[0, 1, 2].map((i) => <Bird key={`bird-${i}`} index={i} />)}
        {[0, 1, 2].map((i) => (
           <Cloud key={`c-${i}`} position={[-15 + i * 15, 12 + i, -5]} speed={0.2 + i * 0.1} />
        ))}

        {/* Arbres */}
        {Array.from({ length: 15 }).map((_, i) => {
          const x = ((i * 7.7) % 30) - 15;
          const z = ((i * 13.3) % 30) - 15;
          if (Math.abs(x) < 2 || Math.abs(z) < 2) return null; // Éviter routes
          return (
            <group key={`t-${i}`} position={[x, 0, z]}>
              <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.1, 0.1, 1]} /><meshStandardMaterial color="#78350f" /></mesh>
              <mesh position={[0, 1.2, 0]}><sphereGeometry args={[0.6]} /><meshStandardMaterial color="#10b981" /></mesh>
            </group>
          );
        })}
      </Canvas>
      <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg shadow-sm border border-slate-200 pointer-events-none">
        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mode Visualisation 3D</p>
        <p className="text-[10px] text-slate-500">Données On-Chain synchronisées</p>
      </div>
    </div>
  );
}