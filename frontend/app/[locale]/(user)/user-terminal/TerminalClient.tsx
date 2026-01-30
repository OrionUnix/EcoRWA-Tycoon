'use client';

import { useTranslations } from 'next-intl';
import { 
  LayoutDashboard, 
  Wallet, 
  Building2, 
  TrendingUp, 
  ArrowUpRight, 
  History,
  Zap,
  Globe
} from 'lucide-react';

export default function TerminalClient() {
  const t = useTranslations('dashboard'); // Utilise ta clé "dashboard" du JSON

  // Données simulées pour l'interface
  const recentAssets = [
    { id: '01', name: 'Haussmann Premium', yield: '5.2%', price: '120 USDC' },
    { id: '02', name: 'Alpine Lodge RWA', yield: '6.8%', price: '450 USDC' },
    { id: '03', name: 'Tech Hub Marseille', yield: '4.9%', price: '85 USDC' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 lg:p-8 font-sans">
      {/* HEADER : IDENTITÉ PROTOCOLE */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#E84142] mb-2">
            <Zap size={16} className="fill-current" />
            <span className="text-xs font-black uppercase tracking-[0.4em]">User Terminal v1.0</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black italic uppercase tracking-tighter leading-none">
            {t('title')}<span className="text-[#E84142]">.</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6 bg-white/[0.03] border border-white/10 px-6 py-4 rounded-[24px] backdrop-blur-xl">
          <div className="text-right">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Network Status</p>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Avalanche Fuji
            </div>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <Globe className="text-slate-400" size={20} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLONNE GAUCHE : STATS & VISUEL (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* GRILLE DE STATS FLASH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Wallet Balance */}
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl group hover:border-[#E84142]/50 transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet size={80} />
              </div>
              <div className="relative z-10">
                <div className="p-3 bg-[#E84142]/10 rounded-2xl text-[#E84142] w-fit mb-4">
                  <Wallet size={24} />
                </div>
                <p className="text-slate-400 text-sm font-medium">Available Capital</p>
                <h3 className="text-4xl font-black mt-2">2,450.00 <span className="text-sm text-slate-500 font-mono">USDC</span></h3>
              </div>
            </div>

            {/* Card: Performance */}
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[32px] backdrop-blur-xl group hover:border-emerald-500/50 transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={80} />
              </div>
              <div className="relative z-10">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 w-fit mb-4">
                  <TrendingUp size={24} />
                </div>
                <p className="text-slate-400 text-sm font-medium">Estimated Annual Yield</p>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-4xl font-black mt-2">+12.4%</h3>
                  <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">High Performance</span>
                </div>
              </div>
            </div>
          </div>

          {/* ZONE VISUELLE RWA */}
          <div className="h-[450px] bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent border border-white/10 rounded-[40px] relative overflow-hidden group">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="text-center space-y-4">
                 <div className="relative">
                   <Building2 size={64} className="mx-auto text-[#E84142] opacity-50 group-hover:scale-110 transition-transform duration-500" />
                   <div className="absolute inset-0 blur-2xl bg-[#E84142]/20 scale-150" />
                 </div>
                 <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Real-World Asset Interface</p>
                 <h4 className="text-xl font-black text-white/80">3D Simulation Engine Ready</h4>
               </div>
             </div>
             
             {/* Décoration coin */}
             <div className="absolute bottom-8 right-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full backdrop-blur-md">
                   <div className="w-1.5 h-1.5 bg-[#E84142] rounded-full animate-pulse" />
                   <span className="text-[10px] font-mono text-slate-400">SYNC_DATA_STREAM: ACTIVE</span>
                </div>
             </div>
          </div>
        </div>

        {/* COLONNE DROITE : INVENTAIRE & ACTIONS (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-black uppercase italic text-sm flex items-center gap-2">
                <History size={18} className="text-[#E84142]" />
                Your Portfolio
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">3 ASSETS</span>
            </div>
            
            <div className="space-y-4 flex-grow">
              {recentAssets.map((asset) => (
                <div key={asset.id} className="group flex items-center gap-4 p-4 rounded-[24px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-[#E84142]/30 transition-all cursor-pointer">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-[#E84142] transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-bold group-hover:text-white transition-colors">{asset.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] text-slate-500 uppercase font-mono">{asset.price}</p>
                      <p className="text-[10px] text-emerald-400 font-bold">{asset.yield} APY</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3">
              <button className="w-full py-5 bg-white text-black rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-[#E84142] hover:text-white transition-all transform hover:-translate-y-1">
                Manage All Assets
              </button>
              <button className="w-full py-4 bg-transparent border border-white/10 text-white rounded-[24px] font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">
                Claim Yields ($142.00)
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}