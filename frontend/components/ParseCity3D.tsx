'use client';

import { useBuildingInfo } from '@/hooks/useBuildingInfo';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';


// Puis utiliser les hooks pour chaque bâtiment
export default function ParseCity3D({ onBuildingClick }: any) {
  const { building: building1 } = useBuildingInfo(1);
  const { building: building2 } = useBuildingInfo(2);
  const { building: building3 } = useBuildingInfo(3);

  const buildings: BuildingData[] = useMemo(() => [
    {
      id: 1,
      name: building1?.name || 'Loft Saint-Germain',
      type: 'loft',
      position: [-6, 3, -6],
      color: '#8B5CF6',
      owned: false,
      yield: building1 ? `${building1.yieldPercentage}%` : '4%',
      price: building1 ? `${building1.pricePerToken} USDC` : '150 USDC',
      pluAlert: building1?.pluAlert || 'Chargement...',
      forSale: building1?.isActive ?? true,
    },
    {
      id: 2,
      name: building2?.name || 'Le Bistrot Central',
      type: 'bistrot',
      position: [0, 1.5, 0],
      color: '#F59E0B',
      owned: false,
      yield: building2 ? `${building2.yieldPercentage}%` : '8%',
      price: building2 ? `${building2.pricePerToken} USDC` : '100 USDC',
      pluAlert: building2?.pluAlert || 'Chargement...',
      forSale: building2?.isActive ?? true,
    },
    {
      id: 3,
      name: building3?.name || 'Eco-Tower 2030',
      type: 'tower',
      position: [6, 4, 6],
      color: '#10B981',
      owned: false,
      yield: building3 ? `${building3.yieldPercentage}%` : '6%',
      price: building3 ? `${building3.pricePerToken} USDC` : '250 USDC',
      pluAlert: building3?.pluAlert || 'Chargement...',
      forSale: building3?.isActive ?? true,
    },
  ], [building1, building2, building3]);




// Composant Bâtiment individuel
function Building({ 
  position, 
  width, 
  height, 
  depth, 
  color, 
  owned,
  onClick 
}: any) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && owned) {
      // Animation de glow pour les bâtiments possédés
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Corps principal */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={color} 
          emissive={owned ? color : '#000000'}
          emissiveIntensity={owned ? 0.3 : 0}
        />
      </mesh>

      {/* Toit */}
      <mesh position={[0, height / 2 + 0.2, 0]}>
        <boxGeometry args={[width * 1.1, 0.4, depth * 1.1]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Fenêtres */}
      {Array.from({ length: Math.floor(height / 1.5) }).map((_, floor) =>
        Array.from({ length: 3 }).map((_, col) => (
          <mesh
            key={`window-${floor}-${col}`}
            position={[
              (col - 1) * (width / 4),
              -height / 2 + floor * 1.5 + 0.5,
              depth / 2 + 0.01,
            ]}
          >
            <boxGeometry args={[0.4, 0.6, 0.02]} />
            <meshStandardMaterial 
              color="#fef3c7" 
              emissive="#fbbf24"
              emissiveIntensity={0.5}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

// Composant Voiture animée
function Car({ pathIndex }: { pathIndex: number }) {
  const carRef = useRef<THREE.Group>(null);

  const path = useMemo(() => {
    const paths = [
      [[-15, 0, -8], [15, 0, -8]], // Route horizontale bas
      [[-15, 0, 0], [15, 0, 0]],   // Route horizontale centre
      [[-8, 0, -15], [-8, 0, 15]], // Route verticale gauche
      [[0, 0, -15], [0, 0, 15]],   // Route verticale centre
    ];
    return paths[pathIndex % paths.length];
  }, [pathIndex]);

  useFrame((state) => {
    if (carRef.current) {
      const t = (state.clock.elapsedTime * 0.5 + pathIndex) % 1;
      const [start, end] = path;
      
      carRef.current.position.x = THREE.MathUtils.lerp(start[0], end[0], t);
      carRef.current.position.y = 0.2;
      carRef.current.position.z = THREE.MathUtils.lerp(start[2], end[2], t);
      
      // Rotation selon la direction
      if (Math.abs(start[0] - end[0]) > Math.abs(start[2] - end[2])) {
        carRef.current.rotation.y = 0;
      } else {
        carRef.current.rotation.y = Math.PI / 2;
      }
    }
  });

  return (
    <group ref={carRef}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.4, 1.5]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.6, 0.3, 0.8]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
    </group>
  );
}

// Composant Nuage flottant
function Cloud({ position, speed }: any) {
  const cloudRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.position.x = (state.clock.elapsedTime * speed) % 40 - 20;
    }
  });

  return (
    <group ref={cloudRef} position={position}>
      {[0, 0.5, -0.5, 0.8].map((offset, i) => (
        <mesh key={i} position={[offset, 0, 0]}>
          <sphereGeometry args={[0.8 + Math.random() * 0.4, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

{/* Arbres décoratifs */}
{Array.from({ length: 15 }).map((_, i) => {
  const x = (Math.random() - 0.5) * 30;
  const z = (Math.random() - 0.5) * 30;
  // Éviter les routes
  if (Math.abs(x) % 8 < 2 || Math.abs(z) % 8 < 2) return null;
  
  return (
    <group key={`tree-${i}`} position={[x, 0, z]}>
      {/* Tronc */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      {/* Feuillage */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
    </group>
  );
})}
function Bird({ index }: { index: number }) {
  const birdRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (birdRef.current) {
      const t = state.clock.elapsedTime * 0.3 + index;
      birdRef.current.position.x = Math.sin(t) * 15;
      birdRef.current.position.z = Math.cos(t) * 15;
      birdRef.current.position.y = 10 + Math.sin(t * 2) * 2;
      birdRef.current.rotation.y = t;
    }
  });

  return (
    <group ref={birdRef}>
      <mesh>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

// Dans la scène, ajoute :
{[0, 1, 2].map((i) => (
  <Bird key={`bird-${i}`} index={i} />
))}

// Sol de la ville
function CityGround() {
  return (
    <group>
      {/* Base verte */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>

      {/* Routes */}
      {[-8, 0, 8].map((z, i) => (
        <mesh key={`road-h-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]} receiveShadow>
          <planeGeometry args={[40, 2]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      ))}
      {[-8, 0, 8].map((x, i) => (
        <mesh key={`road-v-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]} receiveShadow>
          <planeGeometry args={[2, 40]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      ))}
    </group>
  );
}

function DayNightCycle() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      const time = (state.clock.elapsedTime * 0.1) % (Math.PI * 2);
      const intensity = 0.5 + Math.sin(time) * 0.5;
      lightRef.current.intensity = intensity;
    }
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[10, 20, 10]}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
    />
  );
}

// Scène principale
export default function ParseCity3D({ onBuildingClick }: any) {
  const buildings = useMemo(() => [
    {
      id: 1,
      name: 'Loft Saint-Germain',
      position: [-6, 3, -6],
      width: 2,
      height: 6,
      depth: 2,
      color: '#8B5CF6',
      owned: false,
    },
    {
      id: 2,
      name: 'Le Bistrot Central',
      position: [0, 2.5, 0],
      width: 2.5,
      height: 5,
      depth: 2.5,
      color: '#F59E0B',
      owned: false,
    },
    {
      id: 3,
      name: 'Eco-Tower 2030',
      position: [6, 4, 6],
      width: 3,
      height: 8,
      depth: 3,
      color: '#10B981',
      owned: false,
    },
    // Bâtiments décoratifs
    {
      id: 4,
      position: [-10, 2, 4],
      width: 1.5,
      height: 4,
      depth: 1.5,
      color: '#64748b',
      owned: false,
    },
    {
      id: 5,
      position: [10, 3, -4],
      width: 2,
      height: 6,
      depth: 2,
      color: '#475569',
      owned: false,
    },
  ], []);

  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-sky-300 to-sky-100 rounded-xl overflow-hidden">
      <Canvas shadows>
        {/* Caméra isométrique */}
        <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={50} />
        <OrbitControls 
          enablePan={false}
          minDistance={15}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
        />

        {/* Éclairage */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.3} color="#60a5fa" />

        {/* Sol et routes */}
        <CityGround />

        {/* Bâtiments */}
        {buildings.map((building) => (
          <Building
            key={building.id}
            {...building}
            onClick={() => onBuildingClick?.(building)}
          />
        ))}

        {/* Voitures animées */}
        {[0, 1, 2, 3].map((i) => (
          <Car key={`car-${i}`} pathIndex={i} />
        ))}

        {/* Nuages flottants */}
        {[0, 1, 2, 3].map((i) => (
          <Cloud
            key={`cloud-${i}`}
            position={[-20 + i * 10, 12 + Math.random() * 3, -5 + Math.random() * 10]}
            speed={0.3 + Math.random() * 0.2}
          />
        ))}

        {/* Brouillard atmosphérique */}
        <fog attach="fog" args={['#87ceeb', 20, 50]} />
      </Canvas>
    </div>
  );
}