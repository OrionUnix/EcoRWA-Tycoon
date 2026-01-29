'use client';
import { useTranslations } from 'next-intl';
import { Wallet, Building2, ShoppingCart, TrendingUp, ShieldCheck, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HowItWorks() {
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const saved = document.cookie.split('; ').find(row => row.startsWith('NEXT_LOCALE='))?.split('=')[1];
    if (saved) setLocale(saved);
  }, []);

  const t = useTranslations(locale === 'en' ? 'en.howItWorks' : 'howItWorks');

  const contracts = [
    { 
      name: 'EcoRWATycoon', 
      addr: '0x3eb8fe6dB6F6cbD4038ddAB73E05D57C8c70C11A', 
      link: 'https://testnet.avascan.info/blockchain/all/address/0x3eb8fe6dB6F6cbD4038ddAB73E05D57C8c70C11A'
    },
    { 
      name: 'MockUSDC', 
      addr: '0x91d5F6B2458ea9f060EDAD50794cc79E7Ec30cE0', 
      link: 'https://testnet.avascan.info/blockchain/all/address/0x91d5F6B2458ea9f060EDAD50794cc79E7Ec30cE0'
    }
  ];

  const steps = [
    { icon: <Wallet size={24} />, key: 'step1', accent: '#E84142' },
    { icon: <Building2 size={24} />, key: 'step2', accent: '#f8fafc' },
    { icon: <ShoppingCart size={24} />, key: 'step3', accent: '#E84142' },
    { icon: <TrendingUp size={24} />, key: 'step4', accent: '#f8fafc' },
  ];

  return (
    <section id="how-it-works" className="relative bg-[#020617] pb-32">
      
      {/* --- LA JONCTION TRANSPARENTE --- */}
      {/* On crée une zone de transition qui démarre de la HeroSection */}
      <div className="w-full h-40 bg-gradient-to-b from-transparent to-[#020617] backdrop-blur-[2px]" />

      <div className="max-w-7xl mx-auto px-6 relative">
        
        {/* Titre et Contrats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <span className="h-[1px] w-12 bg-[#E84142]" />
              <span className="text-[#E84142] font-bold tracking-[0.3em] uppercase text-[10px]">
                Smart Contract Status
              </span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none italic uppercase">
              {t('title')}
            </h2>
          </div>

          {/* Widget Contrats avec (LIVE) */}
          <div className="flex flex-col gap-3 p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl max-w-sm w-full">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#E84142] shadow-[0_0_10px_#E84142]" />
                <span className="text-white font-bold text-[10px] uppercase tracking-widest">Fuji Network</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#E84142]/10 px-2 py-0.5 rounded-full">
                <span className="w-1 h-1 rounded-full bg-[#E84142] animate-pulse" />
                <span className="text-[#E84142] font-black text-[9px] tracking-tighter">LIVE</span>
              </div>
            </div>

            {contracts.map((c, i) => (
              <a 
                key={i} 
                href={c.link} 
                target="_blank" 
                className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] hover:bg-white/[0.05] transition-all border border-white/5 hover:border-[#E84142]/20"
              >
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs group-hover:text-[#E84142] transition-colors">{c.name}</span>
                  <span className="text-slate-500 text-[10px] font-mono opacity-50">{c.addr.slice(0, 10)}...</span>
                </div>
                <ExternalLink size={14} className="text-slate-600 group-hover:text-white" />
              </a>
            ))}
          </div>
        </div>
              
        {/* Grille des étapes en mode Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="group relative h-[320px] flex flex-col p-8 rounded-[3rem] 
                         border border-white/5 bg-white/[0.02] backdrop-blur-md 
                         hover:bg-white/[0.04] hover:border-[#E84142]/40 transition-all duration-500"
            >
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-500"
                  style={{ 
                    borderColor: step.accent + '30', 
                    color: step.accent,
                    boxShadow: `0 0 15px ${step.accent}15` 
                  }}
                >
                  {step.icon}
                </div>
                <span className="text-white/[0.03] font-black text-7xl">
                  {index + 1}
                </span>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#E84142] transition-colors">
                  {t(`${step.key}.title`)}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  {t(`${step.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}