'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, useTexture, Billboard } from '@react-three/drei';
import { useRef, useState, useMemo, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { BUILDINGS_DATA } from '@/data/buildings';
import BuildingPurchaseDialog from '@/components/BuildingPurchaseDialog';

// --- LOGIQUE DE POSITIONNEMENT ---
const getPosFromCoord = (coord: string) => {
  if (!coord || coord.length < 2) return [0, 0, 0];
  const letters = "ABCDEFGHIJ";
  const col = letters.indexOf(coord[0].toUpperCase());
  const row = parseInt(coord.substring(1)) - 1;
  return [(col - 5) * 2 + 1, 0, (row - 5) * 2 + 1];
};

// --- COMPOSANT PRINCIPAL ---
export default function ParseCity3D() {
  const [selected, setSelected] = useState<any>(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [l, setL] = useState<'fr' | 'en'>('fr');

  useEffect(() => {
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as 'fr' | 'en';
    
    if (savedLocale === 'en' || savedLocale === 'fr') {
      setL(savedLocale);
    }
  }, []);

  return (
    <div className="relative w-full h-[750px] bg-[#020617] rounded-3xl overflow-hidden border border-slate-800">
      <Canvas>
        <OrthographicCamera makeDefault zoom={38} position={[100, 100, 100]} />
        <OrbitControls enableRotate={false} enablePan={true} />

        <Suspense fallback={null}>
          <gridHelper args={[20, 10, 0x334155, 0x1e293b]} />
          
          <MovingVehicle texturePath="/assets/buildings/car.png" route={['A4', 'A10', 'J10', 'J1']} speed={2.5} />
          <MovingVehicle texturePath="/assets/buildings/bus.png" route={['C1', 'C10', 'H10', 'H1']} speed={1.2} scale={2.5} />

          <StaticAsset coord="B7" texturePath="/assets/buildings/tree.png" scale={2} />
          <StaticAsset coord="G7" texturePath="/assets/buildings/treeBush.png" scale={4} />
          <StaticAsset coord="G2" texturePath="/assets/buildings/twoTree.png" scale={4} />
          <StaticAsset coord="F6" texturePath="/assets/buildings/tree.png" scale={2} />
          <StaticAsset coord="C4" texturePath="/assets/buildings/streetlight.png" scale={3} />
          <StaticAsset coord="H7" texturePath="/assets/buildings/streetlight.png" scale={3} />

          {BUILDINGS_DATA.map((b) => (
            <IsoBuilding 
              key={b.id} 
              coord={b.coord}
              texturePath={b.img} 
              scale={b.size} 
              onClick={() => setSelected(b)} 
            />
          ))}
        </Suspense>
      </Canvas>

      <BuildingPurchaseDialog 
        buildingId={selected?.id || null} 
        isOpen={isPurchaseOpen} 
        onClose={() => setIsPurchaseOpen(false)} 
      />

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: 300, opacity: 0 }} 
            className="absolute right-6 top-1/2 -translate-y-1/2 w-80 h-[90%] bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.2)] text-white z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-0 flex justify-between items-start">
              <div className="space-y-1">
                <Badge className={`bg-${selected.typeColor}-500/20 text-${selected.typeColor}-400 border-${selected.typeColor}-500/30`}>
                  {selected.type[l]}
                </Badge>
                <h2 className="text-2xl font-bold tracking-tight">{selected.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400">✕</button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-6 py-4">
              <div className="relative bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-center min-h-[180px]">
                <img src={selected.img} alt={selected.name} className="max-h-40 drop-shadow-2xl object-contain" />
              </div>

              <div className="p-4 bg-slate-800/60 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <p className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase">AI Urban Advisor</p>
                  <Badge className={selected.aiReport.riskLevel === 'LOW' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
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

              <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                <p className="text-[10px] uppercase text-blue-400 font-black mb-1 italic">Analyse PLU</p>
                <p className="text-sm text-slate-200 italic">"{selected.pluAlert[l]}"</p>
              </div>
            </div>

            {/* Footer DYNAMIQUE */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-md border-t border-white/10">
              {selected.isMintable ? (
                <>
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-xs">Yield</span>
                      <span className="text-green-400 font-bold">{selected.yield}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-xs">{l === 'fr' ? "Prix d'entrée" : "Entry Price"}</span>
                      <p className="text-2xl font-bold text-white tracking-tighter">{selected.price}</p>
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
    </div>
  );
}

// --- SOUS-COMPOSANTS (IsoBuilding, MovingVehicle, etc.) ---
function IsoBuilding({ coord, texturePath, scale = 5, onClick }: any) {
  const texture = useTexture(texturePath);
  const position = useMemo(() => getPosFromCoord(coord), [coord]);
  const [hovered, setHovered] = useState(false);

  return (
    <group position={new THREE.Vector3(...position)}>
      <Billboard 
        follow={true} 
        position={[0, scale / 2, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; setHovered(false); }}
      >
        <mesh>
          <planeGeometry args={[scale, scale]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.5} color={hovered ? "#ffffff" : "#f1f5f9"} />
        </mesh>
      </Billboard>
    </group>
  );
}

function MovingVehicle({ texturePath, route, speed = 1, scale = 1.5 }: any) {
  const ref = useRef<THREE.Group>(null);
  const texture = useTexture(texturePath);
  const [targetIdx, setTargetIdx] = useState(0);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const targetPos = getPosFromCoord(route[targetIdx]);
    const currentPos = ref.current.position;
    currentPos.x = THREE.MathUtils.lerp(currentPos.x, targetPos[0], delta * speed);
    currentPos.z = THREE.MathUtils.lerp(currentPos.z, targetPos[2], delta * speed);
    if (Math.abs(currentPos.x - targetPos[0]) < 0.1 && Math.abs(currentPos.z - targetPos[2]) < 0.1) {
      setTargetIdx((prev) => (prev + 1) % route.length);
    }
  });

  return (
    <group ref={ref}>
      <Billboard follow={true} position={[0, scale / 2, 0]}>
        <mesh>
          <planeGeometry args={[scale, scale]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
        </mesh>
      </Billboard>
    </group>
  );
}

function StaticAsset({ coord, texturePath, scale = 2 }: any) {
  const texture = useTexture(texturePath);
  const position = getPosFromCoord(coord);
  return (
    <group position={new THREE.Vector3(...position)}>
      <Billboard follow={true} position={[0, scale / 2, 0]}>
        <mesh>
          <planeGeometry args={[scale, scale]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
        </mesh>
      </Billboard>
    </group>
  );
}