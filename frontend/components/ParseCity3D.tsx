'use client';

import React, { Suspense, useState, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import TrafficManager from '@/components/editor/world/TrafficManager';
import { fixPath } from '@/components/editor/config/zoneAssets';
import BuildingPurchaseDialog from '@/components/BuildingPurchaseDialog';

// 🆕 EXACT BUILDING NAME MAPPING from city_map01.glb structure
const BUILDING_NAME_MAP: Record<string, { id: number; name: string }> = {
  'Eco_Building_Slope.005': { id: 1, name: 'Saint-Germain Loft' },
  'Regular_Building_TwistedTower_large.004': { id: 2, name: 'Central Bistro' },
  'Eco_Building_Grid.005': { id: 3, name: 'Eco-Tower 2030' },
  'Eco_Building_Terrace.008': { id: 4, name: 'Résidence Horizon' },
};

// Check if object name matches any building
const getBuildingFromName = (objectName: string) => {
  if (BUILDING_NAME_MAP[objectName]) {
    return BUILDING_NAME_MAP[objectName];
  }

  for (const [key, value] of Object.entries(BUILDING_NAME_MAP)) {
    if (objectName.includes(key) || key.includes(objectName)) {
      return value;
    }
  }

  return null;
};

// Check if object should have emissive lighting
const shouldBeEmissive = (objectName: string) => {
  return objectName.startsWith('Eco_Building') || objectName.startsWith('Regular_Building');
};

// 🆕 CITY MODEL with BOUNDING BOX CENTERING and SCALE 1.0
function CityModel({ onBuildingClick, ownedBuildingIds, isNight }: {
  onBuildingClick: (buildingId: number, buildingName: string) => void;
  ownedBuildingIds: number[];
  isNight: boolean;
}) {
  const cityPath = fixPath('/assets/models/resources/city_map01.glb');
  const { scene } = useGLTF(cityPath);

  // Clone, process, and center scene
  const { clonedScene, centerOffset } = useMemo(() => {
    const cloned = scene.clone();

    // 🆕 COMPUTE BOUNDING BOX for perfect centering
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const offset = center.negate();

    cloned.traverse((child: any) => {
      if (child.isMesh) {
        const building = getBuildingFromName(child.name);

        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;

        if (building) {
          // Store building data for clicks
          child.userData.buildingId = building.id;
          child.userData.buildingName = building.name;
          child.userData.isBuilding = true;

          // Clone material
          if (child.material) {
            child.material = child.material.clone();

            // 🆕 GREEN GLOW for owned buildings
            if (ownedBuildingIds.includes(building.id)) {
              child.material.emissive = new THREE.Color('#22c55e');
              child.material.emissiveIntensity = 0.5;
            }
            // 🆕 PURPLE GLOW for night mode buildings
            else if (isNight && shouldBeEmissive(child.name)) {
              child.material.emissive = new THREE.Color('#7d2ae8');
              child.material.emissiveIntensity = 0.3;
            }
          }
        }

        // 🆕 ORANGE EMISSIVE for street lights
        if (child.name.toLowerCase().includes('light') ||
          child.name.toLowerCase().includes('lamp') ||
          child.name.toLowerCase().includes('street_light')) {
          if (child.material) {
            child.material = child.material.clone();
            child.material.emissive = new THREE.Color('#ff9933');
            child.material.emissiveIntensity = 0.7;
          }
        }
      }
    });

    return { clonedScene: cloned, centerOffset: offset };
  }, [scene, ownedBuildingIds, isNight]);

  const handlePointerDown = (event: any) => {
    event.stopPropagation();

    const intersectedObject = event.object;
    if (intersectedObject?.userData?.isBuilding) {
      onBuildingClick(
        intersectedObject.userData.buildingId,
        intersectedObject.userData.buildingName
      );
    }
  };

  return (
    <primitive
      object={clonedScene}
      onPointerDown={handlePointerDown}
      scale={[0.3, 0.3, 0.3]}
      position={[centerOffset.x, 0, centerOffset.z]}
    />
  );
}

// Green indicator for owned buildings
function OwnedBuildingIndicator({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <pointLight color="#22c55e" intensity={3} distance={15} />
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={1.2}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

export default function ParseCity3D() {
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedBuildingName, setSelectedBuildingName] = useState<string>('');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const isNight = true;

  // MOCK: Replace with useContractBuildings
  const ownedBuildingIds = useMemo(() => [1, 3], []);

  // 🆕 TRAFFIC WAYPOINTS (adjusted for scale 1.0)
  const trafficWaypoints = useMemo(() => {
    const waypoints = new Map();

    const routePoints = [
      { x: -8, z: -8 },
      { x: 8, z: -8 },
      { x: 8, z: 8 },
      { x: -8, z: 8 },
      { x: 0, z: -10 },
      { x: 10, z: 0 },
      { x: 0, z: 10 },
      { x: -10, z: 0 },
    ];

    routePoints.forEach((point, idx) => {
      waypoints.set(`wp-${idx}`, point);
    });

    return waypoints;
  }, []);

  // Building positions for indicators (scale 1.0)
  const buildingIndicatorPositions: Record<number, [number, number, number]> = {
    1: [-6, 6, -6],
    2: [0, 10, 0],
    3: [6, 8, 6],
    4: [-6, 7, 6],
  };

  const handleBuildingClick = (buildingId: number, buildingName: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedBuildingName(buildingName);
    setShowPurchaseDialog(true);
  };

  const handleDialogClose = () => {
    setShowPurchaseDialog(false);
    setSelectedBuildingId(null);
    setSelectedBuildingName('');
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#0f0f12] via-[#1a1a1d] to-[#25252a]">
      <Canvas
        shadows
        camera={{ position: [20, 20, 15], fov: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0f0f12']} />
        <fog attach="fog" args={['#0f0f12', 30, 70]} />

        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[25, 35, 20]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-bias={-0.0001}
        />

        <pointLight position={[-18, 15, -18]} intensity={1.8} color="#7d2ae8" distance={50} />
        <pointLight position={[18, 15, 18]} intensity={1.8} color="#3b82f6" distance={50} />
        <pointLight position={[0, 25, 0]} intensity={1.2} color="#8b5cf6" distance={40} />

        <Suspense fallback={null}>
          {/* Gray studio base */}
          <group position={[0, -3.1, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[45, 2, 45]} />
              <meshStandardMaterial
                color="#1a1a1a"
                roughness={0.3}
                metalness={0.2}
              />
            </mesh>

            <mesh position={[0, 2.55, 0]}>
              <boxGeometry args={[44.5, 0.1, 44.5]} />
              <meshStandardMaterial
                color="#2a2a2a"
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>

            <lineSegments position={[0, 2.6, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(45, 0.05, 45)]} />
              <lineBasicMaterial color="#7d2ae8" opacity={0.6} transparent />
            </lineSegments>
          </group>

          {/* CITY MODEL - Scale 1.0, centered */}
          <CityModel
            onBuildingClick={handleBuildingClick}
            ownedBuildingIds={ownedBuildingIds}
            isNight={isNight}
          />

          {/* Owned building indicators */}
          {ownedBuildingIds.map((buildingId) => {
            const position = buildingIndicatorPositions[buildingId];
            if (!position) return null;

            return <OwnedBuildingIndicator key={buildingId} position={position} />;
          })}

          {/* Traffic */}
          <TrafficManager
            roads={trafficWaypoints}
            zones={new Map()}
            isNight={isNight}
          />

          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          makeDefault
          maxPolarAngle={Math.PI / 2.2}
          minDistance={8}
          maxDistance={40}
          enableDamping
          dampingFactor={0.06}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Purchase Dialog */}
      {showPurchaseDialog && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center">
          <BuildingPurchaseDialog
            buildingId={selectedBuildingId}
            isOpen={showPurchaseDialog}
            onClose={handleDialogClose}
          />
        </div>
      )}

      {/* HUD */}
      <div className="absolute bottom-4 right-4 bg-black/95 backdrop-blur-xl rounded-xl px-4 py-3 border border-violet-500/50 shadow-lg shadow-violet-500/30">
        <p className="text-violet-300 text-xs font-mono font-bold mb-1">
          🏙️ City Map 01
        </p>
        <p className="text-emerald-400 text-[10px] font-mono">
          {ownedBuildingIds.length} Buildings Owned
        </p>
        {selectedBuildingName && (
          <p className="text-cyan-400 text-[10px] font-mono mt-1 border-t border-violet-500/30 pt-1">
            → {selectedBuildingName}
          </p>
        )}
      </div>

      <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-md rounded-lg px-4 py-2.5 border border-purple-500/40 shadow-lg shadow-purple-500/20">
        <p className="text-purple-400 text-xs font-mono">
          💡 Click buildings to purchase
        </p>
        <p className="text-purple-300/60 text-[10px] font-mono mt-1">
          4 buildings available
        </p>
      </div>

      <div className="absolute top-4 right-4 bg-indigo-950/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-purple-400/30">
        <p className="text-purple-300 text-[10px] font-mono">
          🌙 Night Mode
        </p>
      </div>
    </div>
  );
}

// Preload
useGLTF.preload(fixPath('/assets/models/resources/city_map01.glb'));