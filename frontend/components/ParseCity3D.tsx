'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Html } from '@react-three/drei';
import { useRef, useState, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPOSANTS 3D ---

function EnhancedBuilding({ position, width, height, depth, color, owned, onClick, name }: any) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      if (owned) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
      if (hovered) {
        meshRef.current.scale.set(1.05, 1.05, 1.05);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });

  // Génération déterministe des fenêtres
  const windowsData = useMemo(() => {
    const data = [];
    const floors = Math.floor(height / 1.5);
    const cols = 3;
    for (let floor = 0; floor < floors; floor++) {
      for (let col = 0; col < cols; col++) {
        data.push({
          key: `${floor}-${col}`,
          position: [(col - 1) * (width / 4), -height / 2 + floor * 1.5 + 0.5, depth / 2 + 0.01],
          delay: (floor + col) * 0.2
        });
      }
    }
    return data;
  }, [height, width, depth]);

  return (
    <group 
      ref={meshRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Plateforme hexagonale */}
      <mesh position={[0, -height / 2 - 0.3, 0]} receiveShadow>
        <cylinderGeometry args={[width * 0.7, width * 0.7, 0.3, 6]} />
        <meshStandardMaterial 
          color={owned ? "#10b981" : "#1e293b"}
          emissive={owned ? "#10b981" : "#000000"}
          emissiveIntensity={owned ? 0.4 : 0}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Corps principal */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={color}
          emissive={owned ? color : '#000000'}
          emissiveIntensity={owned ? 0.2 : 0}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Toit moderne */}
      <mesh position={[0, height / 2 + 0.3, 0]} castShadow>
        <boxGeometry args={[width * 1.1, 0.6, depth * 1.1]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Antenne */}
      <mesh position={[0, height / 2 + 0.8, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, height / 2 + 1.3, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
      </mesh>

      {/* Fenêtres animées */}
      {windowsData.map((win) => (
        <Window key={win.key} position={win.position} delay={win.delay} />
      ))}

      {/* Label */}
      <Text
        position={[0, -height / 2 - 1, 0]}
        fontSize={0.35}
        color={owned ? "#10b981" : "#ffffff"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {name}
      </Text>
    </group>
  );
}

function Window({ position, delay }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2 + delay) * 0.3 + 0.7;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.4, 0.6, 0.02]} />
      <meshStandardMaterial 
        color="#fef3c7" 
        emissive="#fbbf24" 
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

function AnimatedCar({ pathIndex }: { pathIndex: number }) {
  const carRef = useRef<THREE.Group>(null);
  
  const path = useMemo(() => {
    const paths = [
      [[-18, 0, -8], [18, 0, -8]],
      [[-18, 0, 0], [18, 0, 0]],
      [[-8, 0, -18], [-8, 0, 18]],
      [[0, 0, -18], [0, 0, 18]],
    ];
    return paths[pathIndex % 4];
  }, [pathIndex]);

  useFrame((state) => {
    if (carRef.current) {
      const speed = 0.5 + pathIndex * 0.1;
      const t = (state.clock.elapsedTime * speed + pathIndex * 2) % 1;
      
      carRef.current.position.x = THREE.MathUtils.lerp(path[0][0], path[1][0], t);
      carRef.current.position.z = THREE.MathUtils.lerp(path[0][2], path[1][2], t);
      carRef.current.rotation.y = Math.abs(path[0][0] - path[1][0]) > 1 ? 0 : Math.PI / 2;
    }
  });

  return (
    <group ref={carRef} position={[0, 0.3, 0]}>
      {/* Carrosserie */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.4, 1.6]} />
        <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Toit */}
      <mesh position={[0, 0.3, -0.2]} castShadow>
        <boxGeometry args={[0.6, 0.3, 0.8]} />
        <meshStandardMaterial color="#b91c1c" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Roues */}
      {[[-0.4, -0.2, 0.6], [0.4, -0.2, 0.6], [-0.4, -0.2, -0.6], [0.4, -0.2, -0.6]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}
      {/* Phares */}
      <pointLight position={[0, 0, 1]} intensity={0.5} distance={3} color="#fbbf24" />
    </group>
  );
}

function Cloud({ position, speed, size = 1 }: any) {
  const cloudRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (cloudRef.current) {
      const x = (state.clock.elapsedTime * speed) % 50 - 25;
      cloudRef.current.position.x = x;
    }
  });

  return (
    <group ref={cloudRef} position={position}>
      {[
        [0, 0, 0, 1],
        [0.6 * size, 0.1, 0, 0.8],
        [-0.5 * size, -0.1, 0, 0.9],
        [0.2, 0.4 * size, 0, 0.7]
      ].map(([x, y, z, scale], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.8 * size * scale, 12, 12]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.8}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

function Bird({ index }: { index: number }) {
  const birdRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (birdRef.current) {
      const t = state.clock.elapsedTime * 0.3 + index * 2;
      birdRef.current.position.set(
        Math.sin(t) * 18,
        12 + Math.sin(t * 3) * 2,
        Math.cos(t) * 18
      );
      birdRef.current.rotation.y = t;
    }
  });

  return (
    <group ref={birdRef}>
      <mesh>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Ailes */}
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.5, 0.05, 0.3]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-0.3, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.5, 0.05, 0.3]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

function CityGround() {
  return (
    <group>
      {/* Gazon principal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#10b981" roughness={0.9} />
      </mesh>
      
      {/* Routes horizontales */}
      {[-10, -2, 6].map((z, i) => (
        <group key={`rh-${i}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, z]} receiveShadow>
            <planeGeometry args={[50, 3]} />
            <meshStandardMaterial color="#374151" roughness={0.8} />
          </mesh>
          {/* Lignes blanches */}
          {Array.from({ length: 20 }).map((_, j) => (
            <mesh key={j} rotation={[-Math.PI / 2, 0, 0]} position={[-20 + j * 2, 0.02, z]}>
              <planeGeometry args={[1, 0.2]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Routes verticales */}
      {[-10, -2, 6].map((x, i) => (
        <mesh key={`rv-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]} receiveShadow>
          <planeGeometry args={[3, 50]} />
          <meshStandardMaterial color="#374151" roughness={0.8} />
        </mesh>
      ))}

      {/* Trottoirs */}
      {[-11.5, 11.5].map((x, i) => (
        <mesh key={`sw-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.05, 0]} receiveShadow>
          <planeGeometry args={[1, 50]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      ))}
    </group>
  );
}

function Trees() {
  const treePositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 20; i++) {
      const x = ((i * 13.5) % 40) - 20;
      const z = ((i * 21.7) % 40) - 20;
      if (Math.abs(x) > 3 && Math.abs(z) > 3) {
        positions.push({ x, z, key: `tree-${i}` });
      }
    }
    return positions;
  }, []);

  return (
    <>
      {treePositions.map((pos) => (
        <group key={pos.key} position={[pos.x, 0, pos.z]}>
          {/* Tronc */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          {/* Feuillage */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <sphereGeometry args={[0.7, 12, 12]} />
            <meshStandardMaterial color="#10b981" roughness={0.8} />
          </mesh>
          <mesh position={[0, 2, 0]} castShadow>
            <sphereGeometry args={[0.5, 12, 12]} />
            <meshStandardMaterial color="#059669" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// --- COMPOSANT PRINCIPAL ---

export default function ParseCity3DImproved() {
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'top'>('3d');

  const buildings = useMemo(() => [
    { 
      id: 1, 
      name: 'Loft Saint-Germain', 
      position: [-8, 3, -8], 
      width: 2.5, 
      height: 6, 
      depth: 2.5, 
      color: '#8B5CF6',
      owned: false,
      yield: '4%',
      price: '150 USDC',
    },
    { 
      id: 2, 
      name: 'Le Bistrot Central', 
      position: [0, 2.5, 0], 
      width: 2.5, 
      height: 5, 
      depth: 2.5, 
      color: '#F59E0B',
      owned: true,
      yield: '8%',
      price: '100 USDC',
    },
    { 
      id: 3, 
      name: 'Eco-Tower 2030', 
      position: [8, 4.5, 8], 
      width: 3, 
      height: 9, 
      depth: 3, 
      color: '#10B981',
      owned: false,
      yield: '6%',
      price: '250 USDC',
    },
  ], []);

  return (
    <div className="relative w-full h-[700px] bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-100 rounded-2xl overflow-hidden shadow-2xl">
      {/* Contrôles de vue */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant={viewMode === '3d' ? 'default' : 'outline'}
          onClick={() => setViewMode('3d')}
          className="bg-white/90 backdrop-blur"
        >
          🎮 Vue 3D
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'top' ? 'default' : 'outline'}
          onClick={() => setViewMode('top')}
          className="bg-white/90 backdrop-blur"
        >
          🗺️ Vue Carte
        </Button>
      </div>

      {/* Stats HUD */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-xl p-4 rounded-xl border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-bold text-sm">ParseCity Live</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Total Assets:</span>
            <span className="text-white font-bold">3</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Owned:</span>
            <span className="text-green-400 font-bold">1</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Avg Yield:</span>
            <span className="text-yellow-400 font-bold">6%</span>
          </div>
        </div>
      </div>

      {/* Canvas 3D */}
      <Canvas shadows gl={{ antialias: true, alpha: false }}>
        <PerspectiveCamera 
          makeDefault 
          position={viewMode === 'top' ? [0, 35, 0.1] : [28, 20, 28]} 
          fov={50} 
        />
        <OrbitControls 
          enablePan={false} 
          minDistance={15} 
          maxDistance={50} 
          maxPolarAngle={viewMode === 'top' ? 0 : Math.PI / 2.2}
          minPolarAngle={viewMode === 'top' ? 0 : 0}
        />
        
        {/* Éclairage */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[15, 25, 15]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />
        <pointLight position={[-15, 15, -15]} intensity={0.4} color="#60a5fa" />
        <hemisphereLight intensity={0.3} groundColor="#10b981" />
        
        {/* Brouillard atmosphérique */}
        <fog attach="fog" args={['#87ceeb', 30, 70]} />

        <Suspense fallback={null}>
          <CityGround />
          <Trees />

          {/* Bâtiments */}
          {buildings.map((b) => (
            <EnhancedBuilding
              key={b.id}
              {...b}
              onClick={() => setSelectedBuilding(b)}
            />
          ))}

          {/* Voitures */}
          {[0, 1, 2, 3, 4].map((i) => (
            <AnimatedCar key={`car-${i}`} pathIndex={i} />
          ))}

          {/* Oiseaux */}
          {[0, 1, 2, 3].map((i) => (
            <Bird key={`bird-${i}`} index={i} />
          ))}

          {/* Nuages */}
          {[
            { x: -20, y: 15, z: -10, speed: 0.3, size: 1.2, key: 'cloud-0' },
            { x: 0, y: 18, z: 5, speed: 0.2, size: 1, key: 'cloud-1' },
            { x: 15, y: 16, z: -15, speed: 0.25, size: 1.5, key: 'cloud-2' }
          ].map((cloud) => (
            <Cloud key={cloud.key} position={[cloud.x, cloud.y, cloud.z]} speed={cloud.speed} size={cloud.size} />
          ))}
        </Suspense>
      </Canvas>

      {/* Panel d'information du bâtiment */}
      <AnimatePresence>
        {selectedBuilding && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-6 left-6 right-6 z-20"
          >
            <Card className="p-6 bg-slate-900/95 backdrop-blur-2xl border-slate-700 shadow-2xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    {selectedBuilding.name}
                    {selectedBuilding.owned && (
                      <span className="text-green-400 text-sm">✓</span>
                    )}
                  </h3>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="text-sm bg-purple-500/20 text-purple-300 border-purple-500/30">
                      📈 Yield: {selectedBuilding.yield}
                    </Badge>
                    <Badge variant="outline" className="text-sm border-slate-600 text-slate-300">
                      💰 {selectedBuilding.price}/part
                    </Badge>
                    {selectedBuilding.owned && (
                      <Badge className="bg-green-500 text-white text-sm">
                        ✓ Dans votre portfolio
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBuilding(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-blue-300 mb-2 font-semibold flex items-center gap-2">
                    🤖 Analyse IA • Données temps réel
                  </p>
                  <p className="text-sm text-slate-200">
                    Localisation premium • Zone urbaine dynamique • Rendement stable • Conformité PLU vérifiée
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={selectedBuilding.owned}
                  >
                    {selectedBuilding.owned ? '✓ Possédé' : '🏗️ Acheter des parts'}
                  </Button>
                  {selectedBuilding.owned && (
                    <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/10">
                      💸 Claim Yields
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm text-xs text-slate-600">
        🖱️ Cliquez et glissez pour tourner • 🔍 Scroll pour zoomer • 🏢 Cliquez sur un bâtiment
      </div>
    </div>
  );
}