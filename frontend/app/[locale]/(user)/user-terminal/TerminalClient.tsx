// app/[locale]/(user)/user-terminal/TerminalClient.tsx
'use client';

import Sidebar from "./Sidebar";
import { GlassModule } from "./ui/GlassModule";
import { PerformanceGauge } from "./modules/PerformanceGauge";
import { MapSimulation } from "./modules/MapSimulation"; // <--- Importation de la Map

export default function TerminalClient() {
  return (
    <div className="flex min-h-screen bg-[#020617] text-white selection:bg-[#E84142]/30">
      <Sidebar />
      
      <main className="flex-grow ml-20 p-8 transition-all duration-500">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="subtitle-accent mb-2">Protocol_Interface_v1.0</div>
            <h1 className="title-huge text-5xl tracking-tighter">
              Terminal<span className="text-[#E84142]">_</span>Core
            </h1>
          </div>
          
          <div className="hidden md:flex glass-panel px-6 py-3 items-center gap-4 border-white/10">
            <div className="flex flex-col items-end">
              <span className="label-mono text-[8px] opacity-50">System_Clock</span>
              <span className="font-mono text-xs text-emerald-400">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
          </div>
        </div>

        {/* Grille Modulaire Principale */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* LE MODULE MAP (8 colonnes) */}
          <MapSimulation />

          {/* COLONNE DE DROITE (4 colonnes) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Jauge de tension de marché */}
            <PerformanceGauge value={7.8} />
            
            {/* Module de contrôle financier */}
            <GlassModule title="ASSET_LIQUIDITY">
              <div className="space-y-4">
                <div>
                  <p className="label-mono text-[10px] mb-1">Available_USDC</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-black italic tracking-tighter">$12,450</h2>
                    <span className="text-xs text-slate-500">.00</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="btn-primary py-4 rounded-xl text-[10px] tracking-widest flex items-center justify-center gap-2">
                    REINVEST
                  </button>
                  <button className="btn-glass py-4 rounded-xl text-[10px] border-white/5 hover:border-[#E84142]/50 transition-colors">
                    WITHDRAW
                  </button>
                </div>
              </div>
            </GlassModule>

            {/* Module Statut Réseau */}
            <div className="glass-panel p-4 border-white/5 bg-emerald-500/5">
                <div className="flex justify-between items-center">
                    <span className="label-mono text-[9px]">Gas_Price</span>
                    <span className="text-[10px] font-bold text-emerald-400">1.2 Gwei</span>
                </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}