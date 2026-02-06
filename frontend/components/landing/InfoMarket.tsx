'use client';
import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Zap, GraduationCap, ArrowUpRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { InfoLabel } from '@/components/src/ui/InfoLabel';
import { useTranslations } from 'next-intl';

// Imports Data
import {
  parisMarketHistory,
  franceYieldSpreadHistory,
  accessDataParis
} from '@/data/market/paris';
import {
  newYorkMarketHistory,
  usaYieldSpreadHistory,
  accessDataNY
} from '@/data/market/newyork';

interface InfoMarketProps {
  onClaimUSDC?: () => void;
}

export default function InfoMarket({ onClaimUSDC }: InfoMarketProps) {
  const t = useTranslations('infoMarket');
  const [activeTab, setActiveTab] = useState<'PARIS' | 'NY'>('PARIS');
  const router = useRouter();

  const isParis = activeTab === 'PARIS';

  // --- LOGIQUE DE SÉLECTION DES DONNÉES ---
  const marketHistory = isParis ? parisMarketHistory : newYorkMarketHistory;
  const yieldData = isParis ? franceYieldSpreadHistory : usaYieldSpreadHistory;
  const currentAccessData = isParis ? accessDataParis : accessDataNY;

  const lastYearData = currentAccessData[currentAccessData.length - 1];

  // Paramètres Jauges SVG
  const size = 200;
  const strokeWidth = 15;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;

  const handleAction = () => {
    onClaimUSDC ? onClaimUSDC() : router.push('/dashboard');
  };

  return (
    <section id="Info-analysis" className="relative bg-[#020617] text-white py-20 px-6 font-sans overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#E84142]/10 blur-[120px] pointer-events-none" />

      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto mb-16 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="h-[1.5px] w-8 bg-[#E84142]" />
            <span className="text-[#E84142] font-bold tracking-[0.4em] uppercase text-[9px]">Live Intelligence</span>
          </div>
          <h2 className="title-huge">
            {t('analysisTitle')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">{t('keyFigures')}</span>
          </h2>
        </div>

        <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/10 backdrop-blur-md">
          {['PARIS', 'NY'].map((city) => (
            <button
              key={city}
              onClick={() => setActiveTab(city as any)}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === city ? 'bg-[#E84142] text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* --- GRAPHIQUES SUPÉRIEURS --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 relative z-10">

        {/* Prix m² */}
        <div className="lg:col-span-2 glass-card p-8 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#E84142]/10 rounded-xl border border-[#E84142]/20">
                <Activity size={20} className="text-[#E84142] animate-pulse" />
              </div>
              <div>
                <span className="label-mono">{t('liveData')}</span>
                <h3 className="text-xl font-black italic uppercase tracking-tight">{isParis ? t('priceParis') : t('priceNY')}</h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black italic tracking-tighter">{isParis ? '9 650 €' : '$15 317'}</span>
              <div className="text-[#E84142] text-[10px] font-black flex items-center justify-end gap-0.5">
                <ArrowUpRight size={12} /> {isParis ? '-1.5%' : '+4.0%'}
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marketHistory}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E84142" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E84142" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} dy={10} />
                <Tooltip
                  cursor={{ stroke: '#E84142', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#020617]/80 backdrop-blur-md border border-[#E84142]/50 p-4 rounded-2xl">
                          <span className="text-slate-500 text-[8px] font-bold uppercase">{data.year}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-white font-black text-xl italic">{payload[0].value?.toLocaleString()}</span>
                            <span className="text-white/50 text-xs font-bold">{isParis ? '€' : '$'}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="price" stroke="#E84142" strokeWidth={3} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accessibilité */}
        <div className="glass-card p-8 flex flex-col h-full min-h-[400px]">
          <h3 className="subtitle-accent mb-8">{t('accessibility')}</h3>

          <div className="flex-1 flex flex-row gap-8 items-center h-full">
            <div className="w-12 h-full min-h-[250px] bg-white/5 rounded-full relative overflow-hidden border border-white/10 shadow-inner">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${lastYearData.excluded}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-0 w-full bg-[#E84142] shadow-[0_0_20px_rgba(232,65,66,0.4)]"
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${lastYearData.capable}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="absolute bottom-0 w-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              />
            </div>

            <div className="flex flex-col justify-between h-full min-h-[250px] py-2">
              <div className="flex flex-col">
                <span className="label-mono text-[#E84142] mb-1">{t('excluded')}</span>
                <span className="title-secondary !text-5xl">{lastYearData.excluded}%</span>
              </div>

              <div className="flex flex-col border-t border-white/10 pt-4">
                <span className="label-mono text-emerald-500 mb-1">{t('canBuy')}</span>
                <span className="title-secondary !text-3xl opacity-60">{lastYearData.capable}%</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
            <span className="label-mono">Analysis 2025</span>
            <span className="text-[#E84142] font-black italic">CRITICAL</span>
          </div>
        </div>
      </div>

      {/* --- GRAPHIQUES ANALYTIQUES BAS --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20 relative z-10">

        {/* Arbitrage */}
        <div className="glass-card p-8">
          <div className="mb-6">
            <InfoLabel label={t('stats.yield_spread')} description={t('tooltips.yieldSpread')} />
            <h4 className="text-xl font-black italic uppercase mt-1">
              {isParis ? 'Arbitrage Immo vs Épargne' : 'Arbitrage Immo vs T-Notes'}
            </h4>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yieldData}>
                <defs>
                  <linearGradient id="colorRental" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E84142" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E84142" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="rental" stroke="#E84142" fill="url(#colorRental)" strokeWidth={2} name="Immo %" />
                <Area type="step" dataKey="savings" stroke="#475569" fill="transparent" strokeDasharray="5 5" name="Ref %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tension Locative */}
        <div className="glass-card p-8 flex flex-col items-center justify-between min-h-[400px]">
          <div className="w-full mb-2">
            <div className="flex justify-between items-start w-full">
              <InfoLabel label={t('stats.vacancy_rate')} description={t('tooltips.vacancyRate')} />
            </div>
            <h4 className="text-xl font-black italic uppercase mt-1">{t('vacancy_rate')}</h4>
          </div>

          <div className="relative flex justify-center items-center h-[200px] w-full">
            <svg viewBox={`0 0 ${size} ${size / 2 + 10}`} width={size + 40} height={(size / 2) + 20} className="overflow-visible">
              <defs>
                <linearGradient id="tensionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#E84142" />
                </linearGradient>
              </defs>
              <path d={`M ${center - radius},${center} A ${radius},${radius} 0 0,1 ${center + radius},${center}`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={25} strokeLinecap="round" />
              <motion.path
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (isParis ? 0.75 : 0.94) * circumference }}
                transition={{ duration: 2, ease: "easeOut" }}
                d={`M ${center - radius},${center} A ${radius},${radius} 0 0,1 ${center + radius},${center}`}
                fill="none" stroke="url(#tensionGradient)" strokeWidth={25} strokeDasharray={circumference} strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
              <span className="text-6xl font-black italic tracking-tighter">
                {isParis ? '7.5' : '9.4'}
              </span>
              <span className="label-mono">{t('scoreOutOf')}</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-4 gap-2 mt-4">
            {['FAIBLE', 'MOYEN', 'TENDU', 'CRITIQUE'].map((label, idx) => {
              const colors = ['#10b981', '#f59e0b', '#f97316', '#E84142'];
              const isActive = isParis ? idx <= 2 : idx <= 3;
              return (
                <div key={label} className="flex flex-col gap-1.5">
                  <div className="h-1 rounded-full transition-all duration-1000" style={{ backgroundColor: isActive ? colors[idx] : 'rgba(255,255,255,0.05)' }} />
                  <span className={`text-[7px] text-center font-black uppercase ${isActive ? 'text-white' : 'text-slate-600'}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- FOOTER CTA --- */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-white/[0.01] backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-16 border border-white/5 flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1">
            <h2 className="title-secondary !text-5xl mb-6">
              {t('dominateTitle')} <span className="text-[#E84142]">{t('dominateSpan')}</span>
            </h2>
            <p className="text-slate-400 text-base mb-10 max-w-lg font-medium leading-relaxed">
              {t('marketDescription')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E84142]/20 text-[#E84142]"><Zap size={16} /></div>
                  <h4 className="label-mono !text-[10px]">{t('feature1Title')}</h4>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{t('feature1Desc')}</p>
              </div>
              <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 text-white"><GraduationCap size={16} /></div>
                  <h4 className="label-mono !text-[10px]">{t('feature2Title')}</h4>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{t('feature2Desc')}</p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[400px] bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
            <h3 className="text-lg font-black mb-8 uppercase italic tracking-widest">{t('ecoAdvantage')}</h3>
            <div className="space-y-5 mb-10">
              {[t('adv1'), t('adv2'), t('adv3'), t('adv4')].map((adv, i) => (
                <div key={i} className="flex items-center gap-4 group/item">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E84142]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 group-hover/item:text-white transition-colors">{adv}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleAction}

              className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-xl transition-all hover:bg-[#E84142] hover:text-white hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              {t('startAscent')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}