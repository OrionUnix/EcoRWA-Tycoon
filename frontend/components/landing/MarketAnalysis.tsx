'use client';
import React, { useState, useEffect } from 'react';
import { Zap, BookOpen, Scale, Globe, Check } from 'lucide-react';


const MarketAnalysis = () => {

  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const saved = typeof document !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('NEXT_LOCALE='))?.split('=')[1] 
      : 'fr';
    if (saved) setLocale(saved);
  }, []);

  const translations: any = {
    fr: {
      title: "Pourquoi EcoRWA ?",
      fractional: { title: "Propriété Fractionnée", description: "Investissez à partir de 100 USDC au lieu de centaines de milliers d'euros." },
      passive: { title: "Revenus Passifs", description: "Générez des rendements de 4% à 8% par an automatiquement." },
      transparent: { title: "100% Transparent", description: "Toutes les transactions sont vérifiables sur la blockchain Avalanche." },
      ai: { title: "Analyse IA", description: "Recevez des alertes PLU et analyses de risque en temps réel." }
    },
    en: {
      title: "Why EcoRWA?",
      fractional: { title: "Fractional Ownership", description: "Invest from 100 USDC instead of hundreds of thousands of euros." },
      passive: { title: "Passive Income", description: "Generate 4% to 8% annual returns automatically." },
      transparent: { title: "100% Transparent", description: "All transactions are verifiable on Avalanche blockchain." },
      ai: { title: "AI Analysis", description: "Receive PLU alerts and real-time risk analysis." }
    }
  };

  const t = (path: string) => {
    const keys = path.split('.');
    let current = translations[locale] || translations['en'];
    for (const key of keys) {
      if (current[key]) current = current[key];
      else return path;
    }
    return current;
  };

  const solutions = [
    { icon: <Zap className="w-6 h-6 text-red-500" />, key: 'fractional' },
    { icon: <Scale className="w-6 h-6 text-red-500" />, key: 'passive' },
    { icon: <BookOpen className="w-6 h-6 text-red-500" />, key: 'transparent' },
    { icon: <Globe className="w-6 h-6 text-red-500" />, key: 'ai' }
  ];

  const tableData = [
    { label: "Liquidity", trad: "Low (Months)", pass: "Medium (Days)", eco: "High (Instant)" },
    { label: "Governance", trad: "Centralized", pass: "Limited", eco: "Active On-Chain" },
    { label: "Accessibility", trad: "High Barrier", pass: "$50+", eco: "$100+ & Edu Mode" },
    { label: "Transparency", trad: "Annual Reports", pass: "On-Chain Only", eco: "AI-Verified Map" },
    { label: "Education", trad: "None", pass: "Limited", eco: "Gamified Learning" },
  ];

  return (
    <section id="market-analysis" className="relative py-24 bg-[#020617] overflow-hidden border-t border-white/5">
      {/* Gradients de fond */}
      <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 via-[#020617] to-[#020617] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none opacity-40" />
      
      <div className="container relative z-10 mx-auto px-4">
        
        {/* Header Industriel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-20 gap-12">
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
              <span className="h-[1px] w-12 bg-[#E84142]" />
              <span className="text-[#E84142] font-bold tracking-[0.3em] uppercase text-[10px]">
                Market Disruption Strategy
              </span>
            </div>
            
            <div className="group">
              <h2 className="text-5xl lg:text-7xl font-black text-white leading-[0.85] tracking-tighter italic uppercase">
                Active Tycoon<span className="text-[#E84142]">.</span><br />
                <span className="text-white/40 group-hover:text-white transition-colors duration-500">
                  Model Strategy
                </span>
              </h2>
            </div>
          </div>

          <div className="flex-shrink-0">
            <p className="max-w-md text-slate-400 text-lg font-medium leading-relaxed border-l-2 border-[#E84142]/30 pl-6">
              {t('title')} — {t('fractional.description')}
            </p>
          </div>
        </div>

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
          {solutions.map((item, idx) => (
            <div 
              key={idx} 
              className="group p-8 rounded-xl bg-white/[0.01] border border-white/[0.05] backdrop-blur-sm hover:bg-white/[0.03] hover:border-red-500/40 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide italic uppercase">
                {t(`${item.key}.title`)}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-light group-hover:text-slate-300 transition-colors">
                {t(`${item.key}.description`)}
              </p>
            </div>
          ))}
        </div>

        {/* Tableau de comparaison */}
        <div className="relative group">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-white/20 font-black text-4xl italic tracking-tighter">04</span>
            <div className="h-[1px] flex-grow bg-white/10" />
            <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Comparative Performance</span>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-black/40 backdrop-blur-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="p-6 text-slate-500 font-bold text-xs uppercase tracking-[0.2em] border-b border-white/[0.05]">Metrics</th>
                  <th className="p-6 text-slate-500 font-bold text-xs uppercase tracking-[0.2em] border-b border-white/[0.05]">Traditional SCI</th>
                  <th className="p-6 text-slate-500 font-bold text-xs uppercase tracking-[0.2em] border-b border-white/[0.05]">Passive RWAs</th>
                  <th className="p-6 text-red-500 font-black text-xs uppercase tracking-[0.3em] border-b border-white/[0.05] bg-red-500/[0.03]">EcoRWA Tycoon</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {tableData.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors group/row">
                    <td className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest italic">{row.label}</td>
                    <td className="p-6 text-slate-600 text-sm font-light">{row.trad}</td>
                    <td className="p-6 text-slate-500 text-sm font-light">{row.pass}</td>
                    <td className="p-6 font-black text-white bg-red-500/[0.02]">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(232,65,66,0.8)]" />
                        <span className="tracking-tight text-xs uppercase italic">{row.eco}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketAnalysis;