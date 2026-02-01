// app/[locale]/(user)/user-terminal/modules/MapSimulation.tsx
'use client';

import { useState } from 'react';
import { GlassModule } from "../ui/GlassModule";
import { Zap, Droplets, Crosshair, Box } from 'lucide-react';

export function MapSimulation() {
  const [activeNetwork, setActiveNetwork] = useState<'none' | 'energy' | 'water'>('none');

  // Simulation de positions pour tes futurs bâtiments 3D
  const assets3D = [
    { id: 'loft-1', x: '45%', y: '40%', name: 'LOFT_ST_GERMAIN' },
    { id: 'tower-1', x: '55%', y: '52%', name: 'ECO_TOWER_2030' },
  ];

  return (
    <GlassModule title="CENTRAL_PARIS_INFRASTRUCTURE" className="col-span-12 lg:col-span-8 min-h-[600px]">
      
      {/* Barre d'outils supérieure */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
        <div className="flex bg-black/60 rounded-lg p-1 border border-white/10 backdrop-blur-md">
          <button 
            onClick={() => setActiveNetwork('energy')}
            className={`p-2 rounded-md transition-all ${activeNetwork === 'energy' ? 'bg-amber-500/20 text-amber-500' : 'text-slate-500'}`}
          >
            <Zap size={16} />
          </button>
          <button 
            onClick={() => setActiveNetwork('water')}
            className={`p-2 rounded-md transition-all ${activeNetwork === 'water' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500'}`}
          >
            <Droplets size={16} />
          </button>
        </div>
        <button className="p-2 bg-[#E84142]/10 border border-[#E84142]/20 text-[#E84142] rounded-lg">
          <Crosshair size={16} />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-grow bg-[#0a0a0c] rounded-xl border border-white/5 overflow-hidden blueprint-grid">
        
        {/* Filtre de balayage CRT */}
        <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_2px,3px_100%]" />

        {/* Conteneur Map & Assets */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full transform scale-110">
            
            {/* Nouveau fond Paris_Inner */}
            <img 
              src="/assets/maps/paris_inner.svg" 
              className="w-full h-full object-contain opacity-40 invert brightness-200"
              alt="Paris Inner"
            />

            {/* Réseaux animés (Masking) */}
            {activeNetwork !== 'none' && (
              <img 
                src="/assets/maps/paris_inner.svg" 
                className={`absolute inset-0 w-full h-full object-contain ${activeNetwork === 'energy' ? 'network-energy' : 'network-water'}`}
                style={{ 
                    maskImage: 'url(/assets/maps/paris_inner.svg)', 
                    WebkitMaskImage: 'url(/assets/maps/paris_inner.svg)',
                    maskSize: 'contain', WebkitMaskSize: 'contain' 
                }}
              />
            )}

            {/* MARQUEURS POUR ASSETS 3D (Future position des .glb) */}
            {assets3D.map((asset) => (
              <div 
                key={asset.id}
                className="absolute z-30 group"
                style={{ left: asset.x, top: asset.y }}
              >
                <div className="relative flex items-center justify-center">
                    <div className="absolute w-8 h-8 bg-[#E84142]/20 rounded-full animate-ping" />
                    <Box size={14} className="text-[#E84142] relative z-10" />
                    
                    {/* Étiquette info */}
                    <div className="absolute left-6 top-0 hidden group-hover:block bg-black/90 border border-white/10 p-2 rounded backdrop-blur-xl min-w-[120px]">
                        <p className="text-[9px] font-bold text-white mb-1 tracking-tighter">{asset.name}</p>
                        <div className="flex justify-between items-center text-[7px] text-emerald-400 font-mono">
                            <span>STATUS: LIVE</span>
                            <span>SYNC: 100%</span>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard de données inférieur */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex justify-between items-end">
            <div className="bg-black/60 border border-white/5 p-3 rounded-lg backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[8px] font-bold text-slate-300">LIVE_DATA_FEED: ACTIVE</span>
                </div>
                <p className="text-[7px] font-mono text-slate-500">LAT: 48.88N / LNG: 2.35 / AREA: NORTH_WEST</p>
            </div>

            <div className="flex gap-2">
                <div className="bg-black/40 border border-white/5 px-4 py-2 rounded flex flex-col items-center">
                    <span className="text-[7px] text-slate-500">NODE_HEALTH</span>
                    <span className="text-[10px] font-bold text-emerald-400">98.2%</span>
                </div>
                <div className="bg-black/40 border border-white/5 px-4 py-2 rounded flex flex-col items-center">
                    <span className="text-[7px] text-slate-500">DENSITY</span>
                    <span className="text-[10px] font-bold text-amber-500">HIGH</span>
                </div>
            </div>
        </div>
      </div>
    </GlassModule>
  );
}