'use client';

import React, { Suspense, useState, useMemo, useRef } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader, KTX2Loader } from 'three-stdlib';

import TrafficSystem from '@/components/city/TrafficSystem';
import BuildingPlacer from '@/components/city/BuildingPlacer';
import SaleIcons from '@/components/city/SaleIcons';
import { fixPath } from '@/components/editor/config/zoneAssets';
import BuildingPurchaseDialog from '@/components/BuildingPurchaseDialog';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// --- CITY MODEL WITH SHADER FIX ---
function CityModel({ onBuildingClick, isNight, onSceneReady }: any) {
  const { gl } = useThree();
  const cityPath = fixPath('/assets/models/resources/city_map01.glb');

  const gltf = useLoader(GLTFLoader, cityPath, (loader) => {
    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/')
      .detectSupport(gl);
    loader.setKTX2Loader(ktx2Loader);
  });

  const clonedScene = useMemo(() => {
    const cloned = gltf.scene.clone();

    cloned.traverse((child: any) => {
      if (child.isMesh) {
        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;

        // Fix Tile_1 shader (MAX_TEXTURE_IMAGE_UNITS)
        if (child.material && child.material.name === 'Tile_1') {
          const oldMat = child.material;
          child.material = new THREE.MeshLambertMaterial({
            map: oldMat.map,
            color: oldMat.color,
            transparent: oldMat.transparent,
            opacity: oldMat.opacity
          });
        }
      }
    });

    // On informe le TrafficSystem que la scène est prête
    if (onSceneReady) onSceneReady(cloned);
    return cloned;
  }, [gltf]);

  const MAPPED_BUILDINGS: Record<string, number> = {
    "Eco_Building_Slope.005": 1,
    "Regular_Building_TwistedTower_large.004": 2,
    "Eco_Building_Terrace.008": 3
  };

  return (
    <primitive
      object={clonedScene}
      onPointerDown={(e: any) => {
        e.stopPropagation();
        let curr = e.object;
        while (curr) {
          if (MAPPED_BUILDINGS[curr.name]) {
            onBuildingClick(MAPPED_BUILDINGS[curr.name]);
            return;
          }
          curr = curr.parent;
        }
      }}
      scale={[0.5, 0.5, 0.5]}
    />
  );
}

export default function ParseCity3D() {
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNight, setIsNight] = useState(true);
  const citySceneRef = useRef<THREE.Group | null>(null);

  const ownedBuildingIds = useMemo(() => [1], []); // Mock - replace with real data

  return (
    <div className="relative w-full h-full bg-[#0f0f12]">
      <Canvas shadows gl={{ antialias: true, outputColorSpace: THREE.SRGBColorSpace }}>
        <PerspectiveCamera makeDefault position={[70, 70, 70]} />

        <Suspense fallback={<mesh><boxGeometry /><meshStandardMaterial color="black" /></mesh>}>
          <CityModel
            onBuildingClick={(id: number) => {
              setSelectedBuildingId(id);
              setIsDialogOpen(true);
            }}
            isNight={isNight}
            onSceneReady={(scene: THREE.Group) => { citySceneRef.current = scene; }}
          />

          {citySceneRef.current && (
            <>
              <TrafficSystem isNight={isNight} cityScene={citySceneRef.current} />
              <BuildingPlacer cityScene={citySceneRef.current} />
              <SaleIcons cityScene={citySceneRef.current} ownedBuildingIds={ownedBuildingIds} />
            </>
          )}

          <Environment preset={isNight ? 'night' : 'city'} />
        </Suspense>

        <OrbitControls makeDefault maxDistance={300} minDistance={30} />

        <EffectComposer>
          <Bloom
            luminanceThreshold={1.5}
            mipmapBlur
            intensity={1.5}
            radius={0.4}
          />
        </EffectComposer>

        <directionalLight
          castShadow
          position={[50, 70, 50]}
          intensity={isNight ? 0.4 : 1.2}
          shadow-bias={-0.0001}
          shadow-mapSize={[2048, 2048]}
        >
          <orthographicCamera attach="shadow-camera" args={[-75, 75, 75, -75, 0.1, 500]} />
        </directionalLight>
        <ambientLight intensity={isNight ? 0.2 : 0.6} />

        {/* Additional night lights */}
        {isNight && (
          <>
            <pointLight position={[-40, 20, -40]} intensity={1.5} color="#7d2ae8" distance={60} />
            <pointLight position={[40, 20, 40]} intensity={1.5} color="#3b82f6" distance={60} />
          </>
        )}
      </Canvas>

      {isDialogOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <BuildingPurchaseDialog
            buildingId={selectedBuildingId}
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
          />
        </div>
      )}

      <button
        onClick={() => setIsNight(!isNight)}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full backdrop-blur-md border border-white/30 transition-all font-bold"
      >
        {isNight ? '🌙 PASSER AU JOUR' : '☀️ PASSER À LA NUIT'}
      </button>
    </div>
  );
}