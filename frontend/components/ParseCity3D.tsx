'use client';

/**
 * ParseCity3D - Unified 3D City View
 * Uses the Editor's rendering engine for a consistent and dynamic city experience.
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, useGLTF } from '@react-three/drei';
import { useState, Suspense, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

// Config
import { ZONE_TYPES } from '@/components/editor/config/zoneAssets';

// Editor Components (Unified Rendering)
import Roads from '@/components/editor/Roads';
import Rivers from '@/components/editor/world/Rivers';
import NatureProps from '@/components/editor/world/NatureProps';
import BuildingTile from '@/components/editor/BuildingTile';
import TrafficManager from '@/components/editor/world/TrafficManager';
import CameraRig from '@/components/zones/CameraRig';

// Data
import { INITIAL_CITY_LAYOUT } from '@/data/initialCityLayout';
import { BUILDINGS_DATA, BuildingData } from '@/data/buildings';
import BuildingPurchaseDialog from '@/components/BuildingPurchaseDialog';

interface ParseCity3DProps {
  onBuildingClick?: (data: { id: number }) => void;
}

// Preload all assets
const preloadAllAssets = () => {
  // Buildings
  [ZONE_TYPES.RESIDENTIAL, ZONE_TYPES.COMMERCIAL, ZONE_TYPES.INDUSTRIAL].forEach((zone: any) => {
    zone.models.forEach((m: any) => useGLTF.preload(`${zone.path}${m.file}`));
  });

  // Nature
  ZONE_TYPES.NATURE.models.forEach((m: any) => useGLTF.preload(`${ZONE_TYPES.NATURE.path}${m.file}`));

  // Infrastructure
  Object.values(ZONE_TYPES.INFRASTRUCTURE.roads.models).forEach((file: any) =>
    useGLTF.preload(`${ZONE_TYPES.INFRASTRUCTURE.roads.path}${file}`));
  Object.values(ZONE_TYPES.INFRASTRUCTURE.rivers.models).forEach((file: any) =>
    useGLTF.preload(`${ZONE_TYPES.INFRASTRUCTURE.rivers.path}${file}`));

  // Vehicles
  Object.values(ZONE_TYPES.VEHICLES.models).forEach((file: any) =>
    useGLTF.preload(`${ZONE_TYPES.VEHICLES.path}${file}`));
};

// Initial preload
preloadAllAssets();

// Sub-component to manage the Day/Night Cycle logic
function DayNightCycle({ onCycleUpdate }: { onCycleUpdate: (data: { time: number, isNight: boolean, sunIntensity: number }) => void }) {
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    // Very slow cycle: 1 full cycle every 120 seconds
    timeRef.current += delta * 0.05;
    const time = (Math.sin(timeRef.current) + 1) / 2; // 0 to 1
    const isNight = time < 0.3;
    const sunIntensity = Math.max(0, Math.sin(timeRef.current) * 1.5);

    onCycleUpdate({ time, isNight, sunIntensity });

    // Smoothly transition background color if needed
    // state.scene.background = new THREE.Color(isNight ? '#020617' : '#0f172a');
  });

  return null;
}

export default function ParseCity3D({ onBuildingClick: externalOnBuildingClick }: ParseCity3DProps) {
  const [selected, setSelected] = useState<BuildingData | null>(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');

  // Day/Night State
  const [cycle, setCycle] = useState({ time: 0.5, isNight: false, sunIntensity: 1 });

  // Load locale
  useEffect(() => {
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as 'fr' | 'en';
    if (savedLocale) setLocale(savedLocale);
  }, []);

  const l = locale;

  // Handle click
  const handleBuildingClick = useCallback((id: number) => {
    const building = BUILDINGS_DATA.find(b => b.id === id);
    if (building) {
      setSelected(building);
      externalOnBuildingClick?.({ id: building.id });
    }
  }, [externalOnBuildingClick]);

  return (
    <div className="relative w-full h-[750px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">

      {/* Cycle Indicator Badge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <Badge variant="outline" className="bg-slate-900/40 backdrop-blur-md border-white/5 text-[10px] uppercase tracking-widest px-3 py-1">
          {cycle.isNight ? '🌙 Night Cycle' : '☀️ Day Cycle'}
        </Badge>
      </div>

      <Canvas camera={{ position: [30, 30, 30], fov: 45 }} dpr={[1, 1.2]}>
        {/* OrbitControls are required for the CameraRig to work correctly */}
        <OrbitControls makeDefault enableDamping={false} />
        {/* Day/Night Cycle Logic */}
        <DayNightCycle onCycleUpdate={setCycle} />

        {/* Dynamic Lighting */}
        <ambientLight intensity={cycle.isNight ? 0.1 : 0.4} />
        <directionalLight
          position={[20, 40, 20]}
          intensity={cycle.sunIntensity}
        />

        {cycle.isNight && (
          <>
            <pointLight position={[0, 15, 0]} intensity={0.8} color="#4f46e5" distance={50} />
            <pointLight position={[-15, 10, 15]} intensity={0.5} color="#818cf8" distance={30} />
            <pointLight position={[15, 10, -15]} intensity={0.5} color="#818cf8" distance={30} />
          </>
        )}

        {/* Centralized Camera Rig */}
        <CameraRig />

        <Suspense fallback={null}>
          {/* Ground - Better visual quality */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial
              color={cycle.isNight ? "#020617" : "#0f172a"}
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>

          <gridHelper
            args={[25, 25, 0x1e293b, 0x0f172a]}
            position={[0, 0, 0]}
          />

          {/* Render Components from Editor System */}
          <Rivers
            riverNetwork={INITIAL_CITY_LAYOUT.riverNetwork}
            previewPoints={[]}
            gridSize={1}
          />

          <Roads
            roadNetwork={INITIAL_CITY_LAYOUT.roadNetwork}
            previewPoints={[]}
            mode={null}
            gridSize={2}
            isNight={cycle.isNight}
          />

          <TrafficManager
            roads={INITIAL_CITY_LAYOUT.roadNetwork}
            zones={INITIAL_CITY_LAYOUT.zones as any}
            props={INITIAL_CITY_LAYOUT.props}
            isNight={cycle.isNight}
          />

          <NatureProps props={INITIAL_CITY_LAYOUT.props} />

          {/* Buildings */}
          {Array.from(INITIAL_CITY_LAYOUT.zones.values()).map((z) => (
            <BuildingTile
              key={`${z.x},${z.z}`}
              x={z.x}
              z={z.z}
              type={z.type}
              roadNetwork={INITIAL_CITY_LAYOUT.roadNetwork}
              isBeingDestroyed={false}
              isPreview={false}
              id={z.id}
              onClick={handleBuildingClick}
            />
          ))}

          <ContactShadows opacity={0.4} scale={50} blur={2} far={15} resolution={256} />
          <Environment preset={cycle.isNight ? "night" : "city"} />
        </Suspense>
      </Canvas>

      {/* Building Dialog */}
      <BuildingPurchaseDialog
        buildingId={selected?.id || null}
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
      />

      {/* Info Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-80 h-[90%] bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.2)] text-white z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-0 flex justify-between items-start">
              <div className="space-y-1">
                <Badge className={`bg-${selected.typeColor}-500/20 text-${selected.typeColor}-400 border-${selected.typeColor}-500/30`}>
                  {selected.type[l]}
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight">{selected.name}</h2>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selected.typeColor === 'blue' ? 'bg-blue-500' : selected.typeColor === 'orange' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                  <p className="text-xs text-slate-400 uppercase">{selected.coord}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-6 py-4">
              {/* Image Preview */}
              <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl p-4 border border-white/5 flex items-center justify-center min-h-[140px] overflow-hidden group">
                <div className="text-center group-hover:scale-105 transition-transform duration-500">
                  <div className="text-5xl mb-2">🏢</div>
                  <p className="text-xs text-slate-400 font-medium tracking-tight">{l === 'fr' ? 'Vue du Domaine' : 'Estate View'}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Yield</p>
                  <p className="text-green-400 font-bold text-lg">{selected.yield}</p>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Size</p>
                  <p className="text-blue-400 font-bold text-lg">{selected.size} units</p>
                </div>
              </div>

              {/* AI Report */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <p className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase tracking-tighter">AI Urban Analyst</p>
                  <Badge className={selected.aiReport.riskLevel === 'LOW' ? "bg-green-500/20 text-green-400" : selected.aiReport.riskLevel === 'MEDIUM' ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}>
                    {selected.aiReport.riskLevel} Risk
                  </Badge>
                </div>
                <div className="space-y-3 text-xs leading-relaxed">
                  <div>
                    <p className="text-green-400 font-bold mb-1 uppercase tracking-wider">↗ {l === 'fr' ? 'Opportunités' : 'Opportunities'}</p>
                    <ul className="text-slate-300 space-y-1 list-disc pl-4">
                      {selected.aiReport.opportunities[l].map((opt, i) => <li key={i}>{opt}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* PLU Alert */}
              <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                <p className="text-[10px] uppercase text-blue-400 font-black mb-1 italic">Regulatory Insights</p>
                <p className="text-sm text-slate-200 italic leading-snug">"{selected.pluAlert[l]}"</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/10">
              {selected.isMintable ? (
                <>
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{l === 'fr' ? "Prix d'entrée" : "Entry Price"}</span>
                      <p className="text-2xl font-bold text-white tracking-tighter">{selected.price}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsPurchaseOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 h-12 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] font-bold"
                  >
                    {l === 'fr' ? 'Investir maintenant' : 'Invest now'}
                  </Button>
                </>
              ) : (
                <Button disabled className="w-full bg-slate-800 text-slate-500 h-12 rounded-xl cursor-not-allowed border border-white/5 uppercase text-xs font-black tracking-widest">
                  {l === 'fr' ? 'Epuisé' : 'Sold Out'}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Controls Help (Floating) */}
      <div className="absolute left-6 bottom-6 flex flex-col gap-2 z-20 pointer-events-none opacity-60 hover:opacity-100 transition-opacity">
        <div className="bg-slate-900/60 backdrop-blur px-3 py-2 rounded-lg border border-white/5 flex items-center gap-3">
          <div className="flex flex-col gap-1 items-center">
            <div className="w-6 h-6 flex items-center justify-center border border-white/20 rounded text-[10px]">W</div>
            <div className="flex gap-1">
              <div className="w-6 h-6 flex items-center justify-center border border-white/20 rounded text-[10px]">A</div>
              <div className="w-6 h-6 flex items-center justify-center border border-white/20 rounded text-[10px]">S</div>
              <div className="w-6 h-6 flex items-center justify-center border border-white/20 rounded text-[10px]">D</div>
            </div>
          </div>
          <span className="text-[10px] text-slate-300 uppercase tracking-tighter">{l === 'fr' ? 'Déplacer' : 'Move'}</span>
        </div>
        <div className="bg-slate-900/60 backdrop-blur px-3 py-2 rounded-lg border border-white/5 flex items-center gap-2">
          <span className="text-xs">🖱️</span>
          <span className="text-[10px] text-slate-300 uppercase tracking-tighter">Click & Drag {l === 'fr' ? 'Rotation' : 'Rotate'}</span>
        </div>
      </div>
    </div>
  );
}