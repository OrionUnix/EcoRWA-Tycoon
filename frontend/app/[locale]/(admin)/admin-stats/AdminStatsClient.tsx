'use client';

import { useTranslations } from 'next-intl';
import { 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Activity, 
  Database, 
  ArrowUpRight, 
  Layers 
} from 'lucide-react';

export default function AdminStatsClient() {
  const t = useTranslations('admin'); // Assure-toi d'avoir "admin" dans ton en.json/fr.json

  // Données fictives pour l'interface
  const stats = [
    { label: "Total TVL", value: "$1,284,000", icon: Database, color: "text-emerald-400" },
    { label: "Active Investors", value: "1,142", icon: Users, color: "text-blue-400" },
    { label: "Verified Assets", value: "24", icon: ShieldCheck, color: "text-[#E84142]" },
    { label: "Network Load", value: "12ms", icon: Activity, color: "text-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 lg:p-8">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-start">
        <div>
          <p className="text-[#E84142] font-bold text-xs uppercase tracking-[0.4em] mb-3">
            System Administration
          </p>
          <h1 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter">
            Protocol Stats<span className="text-[#E84142]">.</span>
          </h1>
        </div>
        
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full hidden md:flex items-center gap-3">
          <div className="w-2 h-2 bg-[#E84142] rounded-full animate-ping" />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Live Node: Fuji-Testnet</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* GRID DE STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/[0.03] border border-white/10 p-6 rounded-[32px] backdrop-blur-md hover:border-white/20 transition-all">
              <stat.icon className={`${stat.color} mb-4`} size={28} />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-black mt-1 tracking-tight">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* SECTION GRAPHIQUE PLACEHOLDER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-[40px] p-8 h-[400px] relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <BarChart3 size={18} className="text-[#E84142]" />
                Transaction Volume (24h)
              </h4>
              <button className="text-[10px] bg-white/10 px-3 py-1 rounded-full hover:bg-[#E84142] transition-colors">EXPORT CSV</button>
            </div>
            
            {/* Visual simulation of a chart */}
            <div className="absolute bottom-0 left-0 w-full h-48 flex items-end gap-1 px-8 opacity-40">
              {[40, 70, 45, 90, 65, 80, 30, 100, 50, 75, 40, 60].map((h, i) => (
                <div key={i} className="flex-1 bg-[#E84142] rounded-t-lg transition-all hover:opacity-100" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          {/* SYSTEM LOGS SIDEBAR */}
          <div className="bg-black/40 border border-white/5 rounded-[40px] p-6 font-mono">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-6 flex items-center gap-2">
              <Layers size={14} /> System Logs
            </h4>
            <div className="space-y-4 text-[11px]">
              <p className="text-emerald-400/80 underline tracking-tighter">[09:42:01] Block #482910 confirmed</p>
              <p className="text-slate-500">[09:42:05] Smart contract call: mintAsset()</p>
              <p className="text-slate-500">[09:42:12] User 0x...4f2 connected</p>
              <p className="text-orange-400/80">[09:42:18] Warning: Gas price volatility high</p>
              <p className="text-slate-500">[09:42:25] Syncing RWA metadata...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}