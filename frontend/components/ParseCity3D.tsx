'use client';

/**
 * ParseCity3D - Composant principal de la ville 3D
 * Intègre toutes les zones modulaires et gère l'interaction
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { useState, Suspense, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import type { Building3D } from '@/types/cityTypes';

// Import des zones modulaires
import DowntownZone from '@/components/city3d/zones/DowntownZone';
import ResidentialZone from '@/components/city3d/zones/ResidentialZone';
import CommercialZone from '@/components/city3d/zones/CommercialZone';
import IndustrialZone from '@/components/city3d/zones/IndustrialZone';
import RoadNetwork from '@/components/city3d/RoadNetwork';
import CityDecorations from '@/components/city3d/CityDecorations';
import VehicleSystem from '@/components/city3d/VehicleSystem';
import BuildingPurchaseDialog from '@/components/BuildingPurchaseDialog';

// Position des zones dans la ville
const ZONE_POSITIONS = {
  downtown: [-4, 0, -6] as [number, number, number],
  residential: [-10, 0, 2] as [number, number, number],
  commercial: [4, 0, 2] as [number, number, number],
  industrial: [8, 0, -6] as [number, number, number],
} as const;

// Composant de chargement
function LoadingFallback() {
  return (
    <mesh position={[0, 1, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  );
}

// Sol de la ville
function CityGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#1e293b" />
    </mesh>
  );
}

// Props du composant principal
interface ParseCity3DProps {
  onBuildingClick?: (building: Building3D) => void;
}

// Composant principal
export default function ParseCity3D({ onBuildingClick: externalOnBuildingClick }: ParseCity3DProps) {
  const [selected, setSelected] = useState<Building3D | null>(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');

  // Récupérer la locale depuis les cookies
  useEffect(() => {
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as 'fr' | 'en';

    if (savedLocale === 'en' || savedLocale === 'fr') {
      setLocale(savedLocale);
    }
  }, []);

  // Handler pour la sélection de bâtiment
  const handleBuildingClick = useCallback((building: Building3D) => {
    setSelected(building);
    // Appeler le callback externe si fourni
    externalOnBuildingClick?.(building);
  }, [externalOnBuildingClick]);

  const l = locale; // Raccourci pour la locale

  return (
    <div className="relative w-full h-[750px] bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Canvas 3D */}
      <Canvas shadows camera={{ position: [20, 15, 20], fov: 45 }}>
        {/* Éclairage */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.3} />

        {/* Contrôles de caméra */}
        <OrbitControls
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          minDistance={10}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.2}
        />

        <Suspense fallback={<LoadingFallback />}>
          {/* Sol */}
          <CityGround />

          {/* Grille d'aide */}
          <gridHelper args={[40, 20, 0x334155, 0x1e293b]} position={[0, 0.01, 0]} />

          {/* Routes */}
          <RoadNetwork position={[0, 0, 0]} showLights={true} />

          {/* Zone Centre-ville (Downtown) */}
          <DowntownZone
            position={ZONE_POSITIONS.downtown}
            onBuildingClick={handleBuildingClick}
            selectedBuildingId={selected?.id}
          />

          {/* Zone Résidentielle */}
          <ResidentialZone
            position={ZONE_POSITIONS.residential}
            onBuildingClick={handleBuildingClick}
            selectedBuildingId={selected?.id}
          />

          {/* Zone Commerciale */}
          <CommercialZone
            position={ZONE_POSITIONS.commercial}
            onBuildingClick={handleBuildingClick}
            selectedBuildingId={selected?.id}
          />

          {/* Zone Industrielle */}
          <IndustrialZone
            position={ZONE_POSITIONS.industrial}
            onBuildingClick={handleBuildingClick}
            selectedBuildingId={selected?.id}
          />

          {/* Décorations globales */}
          <CityDecorations />

          {/* Véhicules animés */}
          <VehicleSystem enabled={true} />

          {/* Ombres de contact */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.4}
            scale={50}
            blur={2}
            far={10}
          />

          {/* Environnement HDR pour les reflets */}
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* Dialog d'achat */}
      <BuildingPurchaseDialog
        buildingId={selected?.id ? parseInt(selected.id.split('-').pop() || '0') : null}
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
      />

      {/* Panel d'information du bâtiment sélectionné */}
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
                <p className="text-xs text-slate-400 uppercase">{selected.zone}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400">✕</button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-6 py-4">
              {/* 3D Model Preview Placeholder */}
              <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl p-4 border border-white/5 flex items-center justify-center min-h-[140px]">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏢</div>
                  <p className="text-xs text-slate-400">{l === 'fr' ? 'Modèle 3D' : '3D Model'}</p>
                </div>
              </div>

              {/* AI Report (si disponible) */}
              {selected.aiReport && (
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <p className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase">AI Urban Advisor</p>
                    <Badge className={selected.aiReport.riskLevel === 'LOW' ? "bg-green-500/20 text-green-400" : selected.aiReport.riskLevel === 'MEDIUM' ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}>
                      {selected.aiReport.riskLevel}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-xs">
                    <div>
                      <p className="text-green-400 font-bold mb-1 uppercase tracking-wider">↗ {l === 'fr' ? 'Opportunités' : 'Opportunities'}</p>
                      <ul className="text-slate-300 space-y-1 list-disc pl-4">
                        {selected.aiReport.opportunities[l].map((opt: string, i: number) => <li key={i}>{opt}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-red-400 font-bold mb-1 uppercase tracking-wider">↘ Risks</p>
                      <ul className="text-slate-300 space-y-1 list-disc pl-4">
                        {selected.aiReport.risks[l].map((risk: string, i: number) => <li key={i}>{risk}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* PLU Alert (si disponible) */}
              {selected.pluAlert && (
                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                  <p className="text-[10px] uppercase text-blue-400 font-black mb-1 italic">Analyse PLU</p>
                  <p className="text-sm text-slate-200 italic">"{selected.pluAlert[l]}"</p>
                </div>
              )}
            </div>

            {/* Footer DYNAMIQUE */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-md border-t border-white/10">
              {selected.isMintable ? (
                <>
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs">Yield</span>
                      <span className="text-green-400 font-bold">{selected.yield || 'N/A'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-xs">{l === 'fr' ? "Prix d'entrée" : "Entry Price"}</span>
                      <p className="text-2xl font-bold text-white tracking-tighter">{selected.price || 'N/A'}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsPurchaseOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 h-12 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                  >
                    {l === 'fr' ? 'Investir maintenant' : 'Invest now'}
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-xl border border-white/5">
                    <span className="animate-pulse h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="text-sm text-slate-300 font-medium">{l === 'fr' ? 'Bientôt disponible' : 'Coming soon'}</span>
                  </div>
                  <Button disabled className="w-full bg-slate-800 text-slate-500 h-12 rounded-xl cursor-not-allowed border border-white/5">
                    {l === 'fr' ? 'Ventes fermées' : 'Sales closed'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Légende des zones */}
      <div className="absolute left-6 bottom-6 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-white/10">
        <p className="text-xs text-slate-400 uppercase font-bold mb-1">{l === 'fr' ? 'Zones' : 'Zones'}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-xs text-white">Downtown</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs text-white">{l === 'fr' ? 'Résidentiel' : 'Residential'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-xs text-white">Commercial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-500"></div>
          <span className="text-xs text-white">{l === 'fr' ? 'Industriel' : 'Industrial'}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute left-6 top-6 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
        <p className="text-xs text-slate-400">
          {l === 'fr' ? '🖱️ Cliquez sur un bâtiment pour voir les détails' : '🖱️ Click on a building to see details'}
        </p>
      </div>
    </div>
  );
}