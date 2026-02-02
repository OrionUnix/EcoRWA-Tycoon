'use client';

import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, Html } from '@react-three/drei';
import { useState, Suspense, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

// Tes imports d'origine
import Roads from '@/components/editor/Roads';
import Rivers from '@/components/editor/world/Rivers';
import NatureProps from '@/components/editor/world/NatureProps';
import BuildingTile from '@/components/editor/BuildingTile';
import TrafficManager from '@/components/editor/world/TrafficManager';
import CameraRig from '@/components/zones/CameraRig';
import { INITIAL_CITY_LAYOUT } from '@/data/initialCityLayout';
import { BUILDINGS_DATA, BuildingData } from '@/data/buildings';
import BuildingPurchaseDialog from '@/components/BuildingPurchaseDialog';

// --- COMPOSANT : SOL TACTIQUE ---
function TacticalGrid() {
  return (
    <group>
      {/* Grille de précision type scanner */}
      <gridHelper args={[80, 80, "#06b6d4", "#020617"]} position={[0, 0, 0]} />

      {/* Sol Noir Absolu pour le contraste */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#010204" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

export default function ParseCity3D({
  onBuildingClick: externalOnBuildingClick
}: {
  onBuildingClick?: (data: { id: number }) => void
}) {
  const [selected, setSelected] = useState<BuildingData | null>(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');

  // Load locale
  useEffect(() => {
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as 'fr' | 'en';
    if (savedLocale) setLocale(savedLocale);
  }, []);

  const handleBuildingClick = useCallback((id: number) => {
    const building = BUILDINGS_DATA.find(b => b.id === id);
    if (building) {
      setSelected(building);
      externalOnBuildingClick?.({ id: building.id });
    }
  }, [externalOnBuildingClick]);

  return (
    <div className="relative w-full h-[750px] bg-[#010204] rounded-3xl overflow-hidden border border-white/10 shadow-2xl font-mono">

      {/* Overlay HUD (Scanner effect) */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <div className="text-[#06b6d4] text-[10px] space-y-1">
          <p className="animate-pulse">● FEED_STABLE_v4.0</p>
          <p className="text-white/40">LOCATION: 48.8566° N, 2.3522° E</p>
        </div>
      </div>

      <Canvas
        camera={{ position: [35, 35, 35], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#010204']} />
        <fog attach="fog" args={['#010204', 20, 70]} />

        <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.2} />
        <CameraRig />

        <Suspense fallback={null}>
          <TacticalGrid />

          <Rivers riverNetwork={INITIAL_CITY_LAYOUT.riverNetwork} previewPoints={[]} gridSize={1} />

          <Roads
            roadNetwork={INITIAL_CITY_LAYOUT.roadNetwork}
            previewPoints={[]}
            mode={null}
            gridSize={2}
            isNight={true}
          />

          <TrafficManager
            roads={INITIAL_CITY_LAYOUT.roadNetwork}
            zones={INITIAL_CITY_LAYOUT.zones as any}
            props={INITIAL_CITY_LAYOUT.props}
            isNight={true}
          />

          <NatureProps props={INITIAL_CITY_LAYOUT.props} />

          {/* Mapping des bâtiments corrigé pour BuildingTileProps */}
          {Array.from(INITIAL_CITY_LAYOUT.zones.values()).map((z) => {
            const bData = BUILDINGS_DATA.find(b => b.id === z.id);
            return (
              <BuildingTile
                key={`${z.x},${z.z}`}
                position={[z.x, 0, z.z]}
                type={z.type}
                building={bData}
                zone={z}
                isNight={true}
                id={z.id}
                isMintable={bData?.isMintable || false}
                isOwned={bData?.owned || false}
                onBuildingClick={handleBuildingClick}
              />
            );
          })}

          <ContactShadows opacity={0.7} scale={50} blur={3} far={15} color="#000000" />
          <Environment preset="night" />
        </Suspense>

        <ambientLight intensity={0.15} />
        <pointLight position={[10, 20, 10]} intensity={1.5} color="#06b6d4" />
      </Canvas>

      {/* Building Purchase Dialog */}
      <BuildingPurchaseDialog
        buildingId={selected?.id || null}
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
      />

      {/* Info Panel Latéral */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            className="absolute right-4 top-4 bottom-4 w-80 bg-black/80 backdrop-blur-2xl border border-white/10 p-6 z-50 rounded-2xl flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] uppercase tracking-widest">
                  {selected.type[locale]}
                </Badge>
                <h2 className="text-xl font-bold text-white mt-2 leading-tight">{selected.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-full text-white/40">✕</button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                  <p className="text-[9px] text-white/40 uppercase">Yield</p>
                  <p className="text-emerald-400 font-bold">{selected.yield}</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-center">
                  <p className="text-[9px] text-white/40 uppercase">Size</p>
                  <p className="text-blue-400 font-bold">{selected.size}m²</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2">
                <p className="text-[9px] text-cyan-500 font-bold uppercase underline decoration-cyan-500/30 underline-offset-4">AI_ANALYSIS_REPORT</p>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{selected.aiReport.opportunities[locale][0]}"
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-4 font-bold">
                <span className="text-white/40 text-[10px] uppercase">Market Value</span>
                <span className="text-white text-lg">{selected.price}</span>
              </div>
              <Button
                onClick={() => setIsPurchaseOpen(true)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 h-12 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all font-bold"
              >
                {locale === 'fr' ? 'INVESTIR' : 'INVEST NOW'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}