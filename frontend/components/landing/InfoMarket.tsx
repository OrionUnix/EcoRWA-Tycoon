'use client';
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Zap, GraduationCap, ArrowUpRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

// --- DONNÉES STATIQUES ---
const parisData = [ { year: '2005', price: 5200 }, { year: '2006', price: 5600 }, { year: '2007', price: 6000 }, { year: '2008', price: 6500 }, { year: '2009', price: 6400 }, { year: '2010', price: 7000 }, { year: '2011', price: 8200 }, { year: '2012', price: 8400 }, { year: '2013', price: 8300 }, { year: '2014', price: 8100 }, { year: '2015', price: 8200 }, { year: '2016', price: 8400 }, { year: '2017', price: 8800 }, { year: '2018', price: 9600 }, { year: '2019', price: 10200 }, { year: '2020', price: 10600 }, { year: '2021', price: 9827 }, { year: '2022', price: 10100 }, { year: '2023', price: 10420 }, { year: '2024', price: 10580 }, { year: '2025*', price: 9650 }, ];
const nyData  = [ { year: '2005', price: 9800 }, { year: '2006', price: 11000 }, { year: '2007', price: 12500 }, { year: '2008', price: 13000 }, { year: '2009', price: 11500 }, { year: '2010', price: 11800 }, { year: '2011', price: 12000 }, { year: '2012', price: 12200 }, { year: '2013', price: 12500 }, { year: '2014', price: 12800 }, { year: '2015', price: 13200 }, { year: '2016', price: 13600 }, { year: '2017', price: 14000 }, { year: '2018', price: 14500 }, { year: '2019', price: 14800 }, { year: '2020', price: 14200 }, { year: '2021', price: 14330 }, { year: '2022', price: 15500 }, { year: '2023', price: 15500 }, { year: '2024', price: 14972 }, { year: '2025*', price: 15317 }, ];

const accessDataNY = [ { name: 'Capable', value: 18 }, { name: 'Excluded', value: 82 } ];
const accessDataParis = [ { name: 'Capable', value: 25 }, { name: 'Excluded', value: 75 } ];

export default function InfoMarket() {
  const [activeTab, setActiveTab] = useState<'PARIS' | 'NY'>('PARIS');
  const [locale, setLocale] = useState('fr');

  const size = 200;
  const strokeWidth = 15;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;

  const translations: any = {
    fr: {
      liveData: "Temps réel",
      analysisTitle: "Analyse des",
      keyFigures: "Chiffres Clés",
      priceParis: "Évolution Prix m² (Paris)",
      priceNY: "Prix Médian (Manhattan)",
      accessibility: "Accès à la Propriété",
      canBuy: "Capables",
      interestRate: "Taux d'intérêt moyen",
      medianRent: "Loyer médian",
      low: "Très faible",
      criticallyLow: "Critiquement bas",
      slowRecovery: "Reprise lente",
      strainedActive: "Tendu mais actif",
      dominateTitle: "Dominez le marché",
      dominateSpan: "avec EcoRWA",
      marketDescription: "Le marché traditionnel de 2025 est verrouillé. EcoRWA brise les barrières.",
      solutionSpan: "",
      feature1Title: "Liquidité Instantanée",
      feature1Desc: "Échangez vos parts d'actifs en 1 clic.",
      feature2Title: "Simulation",
      feature2Desc: "Maîtrisez les cycles sans risque.",
      ecoAdvantage: "L'avantage EcoRWA",
      adv1: "Dès 100$",
      adv2: "Due Diligence IA",
      adv3: "Gouvernance",
      adv4: "Blockchain",
      startAscent: "Commencer l'ascension"
    },
    en: {
        liveData: "Real-time",
        analysisTitle: "Market Analysis",
        keyFigures: "Key Figures",
        priceParis: "Price/m² Evolution (Paris)",
        priceNY: "Median Price (Manhattan)",
        accessibility: "Property Access",
        canBuy: "Capable",
        interestRate: "Avg Interest Rate",
        medianRent: "Median Rent",
        low: "Very Low",
        criticallyLow: "Critically Low",
        slowRecovery: "Slow Recovery",
        strainedActive: "Strained but active",
        dominateTitle: "Dominate the market",
        dominateSpan: "with EcoRWA",
        marketDescription: "Traditional real estate is locked. EcoRWA breaks the barriers.",
        solutionSpan: "",
        feature1Title: "Instant Liquidity",
        feature1Desc: "Trade shares in 1 click.",
        feature2Title: "Simulation",
        feature2Desc: "Master cycles risk-free.",
        ecoAdvantage: "EcoRWA Advantage",
        adv1: "From $100",
        adv2: "AI Due Diligence",
        adv3: "Governance",
        adv4: "Blockchain",
        startAscent: "Start Ascent"
    }
  };

  const t = (key: string) => translations[locale][key] || key;

  useEffect(() => {
    const saved = document.cookie.split('; ').find(row => row.startsWith('NEXT_LOCALE='))?.split('=')[1];
    if (saved) setLocale(saved);
  }, []);

  return (
    <section id="Info-analysis" className="relative bg-[#020617] text-white py-20 px-6 font-sans overflow-hidden border-t border-white/5">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#E84142]/10 blur-[120px] pointer-events-none" />

      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto mb-16 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="h-[1.5px] w-8 bg-[#E84142]" />
            <span className="text-[#E84142] font-bold tracking-[0.4em] uppercase text-[9px]">
              Live Intelligence
            </span>
          </div>
          {/* Titre réduit en taille */}
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight italic uppercase">
            {t('analysisTitle')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
                {t('keyFigures')}
            </span>
          </h2>
        </div>

        {/* Tab Switcher Style Avalanche */}
        <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/10 backdrop-blur-md">
          {['PARIS', 'NY'].map((city) => (
            <button 
              key={city}
              onClick={() => setActiveTab(city as any)}
              className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                activeTab === city 
                ? 'bg-[#E84142] text-white shadow-[0_0_20px_rgba(232,65,66,0.3)]' 
                : 'text-slate-500 hover:text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 relative z-10">
        
        {/* Animated Area Chart */}
        <div className="lg:col-span-2 bg-white/[0.01] backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-8 md:p-10 hover:border-[#E84142]/20 transition-all group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#E84142]/10 rounded-xl border border-[#E84142]/20">
                <Activity size={20} className="text-[#E84142] animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">{t('liveData')}</span>
                <h3 className="text-xl font-black italic uppercase tracking-tight">
                  {activeTab === 'PARIS' ? t('priceParis') : t('priceNY')}
                </h3>
              </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-3xl font-black italic tracking-tighter">
                  {activeTab === 'PARIS' ? '10 580 €' : '$14 972'}
                </span>
                <span className="text-[#E84142] text-[10px] font-black flex items-center gap-0.5">
                   <ArrowUpRight size={12} /> {activeTab === 'PARIS' ? '+1.5%' : '+4.0%'}
                </span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeTab === 'PARIS' ? parisData : nyData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E84142" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E84142" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} dy={10} />
                <Tooltip 
                  cursor={{stroke: '#E84142', strokeWidth: 1}}
                  contentStyle={{backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px'}} 
                  itemStyle={{color: '#E84142', fontWeight: 'bold'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#E84142" 
                  strokeWidth={3} 
                  fill="url(#colorPrice)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accessibility Card */}
        <div className="bg-white/[0.01] backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between hover:border-white/10 transition-all">
          <h3 className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em]">{t('accessibility')}</h3>
          
          <div className="h-[200px] w-full relative my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                      data={activeTab === 'PARIS' ? accessDataParis : accessDataNY}
                      cx="50%" cy="50%" innerRadius={75} outerRadius={90} paddingAngle={10} dataKey="value"
                      animationBegin={0} animationDuration={1500}
                    >
                    {(activeTab === 'PARIS' ? accessDataParis : accessDataNY).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#E84142' : 'rgba(255,255,255,0.03)'} stroke="none" />
                    ))}
                    </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-5xl font-black italic tracking-tighter">{activeTab === 'PARIS' ? '25%' : '18%'}</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t('canBuy')}</span>
              </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase">{t('interestRate')}</span>
              <span className="text-xs font-black">{activeTab === 'PARIS' ? '3.8%' : '7.23%'}</span>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
              <span className="text-[9px] text-slate-500 font-bold uppercase">{t('medianRent')}</span>
              <span className="text-xs font-black">{activeTab === 'PARIS' ? '1 600 €' : '$4 500'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- ASSET GAUGES --- */}
      <div className="max-w-7xl mx-auto mb-20"> 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { name: "PARIS ASSET", type: t('slowRecovery'), status: t('low'), weight: "9 550 €/m²", percentage: 75, color: "#E84142" },
            { name: "NY ASSET", type: t('strainedActive'), status: t('criticallyLow'), weight: "$15 317/m²", percentage: 92, color: "#ffffff" }
          ].map((asset, i) => {
            const strokeDashoffset = circumference - (asset.percentage / 100) * circumference;
            return (
              <div key={i} className="relative bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 transition-all hover:border-[#E84142]/30 group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-[9px] font-black text-[#E84142] tracking-[0.3em] uppercase mb-1">{asset.name}</h4>
                    <p className="text-lg text-white font-black italic uppercase tracking-tight">{asset.type}</p>
                  </div>
                </div>

                <div className="relative flex justify-center items-center h-[140px]">
                  <svg viewBox={`0 0 ${size} ${size / 2 + 10}`} width={size} height={size / 2 + 10} className="overflow-visible">
                    <path d={`M ${center - radius},${center} A ${radius},${radius} 0 0,1 ${center + radius},${center}`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} strokeLinecap="round" />
                    <motion.path 
                      initial={{ strokeDashoffset: circumference }}
                      whileInView={{ strokeDashoffset }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      d={`M ${center - radius},${center} A ${radius},${radius} 0 0,1 ${center + radius},${center}`} 
                      fill="none" 
                      stroke={asset.color} 
                      strokeWidth={strokeWidth} 
                      strokeDasharray={circumference} 
                      strokeLinecap="round" 
                      style={{ filter: `drop-shadow(0 0 8px ${asset.color}40)` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                    <span className="text-5xl font-black text-white italic tracking-tighter">{asset.percentage}%</span>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-end pt-6 border-t border-white/5">
                  <div>
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Market Value</span>
                    <span className="text-lg font-bold italic">{asset.weight}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${asset.color === '#E84142' ? 'bg-[#E84142]/10 text-[#E84142]' : 'bg-white/10 text-white'}`}>
                    {asset.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- FOOTER CTA --- */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/[0.01] backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-16 border border-white/5 flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-black mb-6 italic uppercase tracking-tighter leading-none">
              {t('dominateTitle')} <span className="text-[#E84142]">{t('dominateSpan')}</span>
            </h2>
            <p className="text-slate-400 text-base mb-10 max-w-lg font-medium leading-relaxed">
              {t('marketDescription')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: <Zap size={18} className="text-[#E84142]" />, title: t('feature1Title') },
                { icon: <GraduationCap size={18} className="text-white" />, title: t('feature2Title') }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.03]">{f.icon}</div>
                  <h4 className="font-black text-[10px] uppercase tracking-widest">{f.title}</h4>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-[400px] bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#E84142] to-transparent opacity-40" />
            <h3 className="text-lg font-black mb-8 uppercase italic tracking-widest">{t('ecoAdvantage')}</h3>
            <div className="space-y-5 mb-10">
              {[t('adv1'), t('adv2'), t('adv3'), t('adv4')].map((adv, i) => (
                <div key={i} className="flex items-center gap-4 group/item">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E84142] shadow-[0_0_8px_#E84142]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 group-hover/item:text-white transition-colors">{adv}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-xl transition-all hover:bg-[#E84142] hover:text-white hover:scale-[1.02] active:scale-95 shadow-2xl">
              {t('startAscent')}
            </button>
          </div>
        </div>
      </div>
      

    </section>
  );
}