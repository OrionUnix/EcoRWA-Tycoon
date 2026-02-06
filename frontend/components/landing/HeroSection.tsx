'use client';

import AnimatedHero from './AnimatedHero';
import { ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function HeroSection() {
  const t = useTranslations('Hero');
  const locale = useLocale();

  return (
    <section className="relative min-h-[90vh] lg:h-screen w-full flex items-center bg-[#020617] overflow-visible">
      {/* Glow d'ambiance Rouge Avalanche en arrière-plan */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#E84142]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-20 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* TEXT CONTENT */}
        <div className="z-20 space-y-8 py-20 lg:py-0">

          {/* BADGE AVALANCHE */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E84142] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E84142]"></span>
            </div>
            <span className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">
              Avalanche <span className="text-[#E84142]">Testnet Fuji</span>
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl lg:text-8xl font-black text-white leading-[0.85] tracking-tighter italic">
              {t('titleLine1')}<span className="text-[#E84142]">.</span><br />
              <span className="text-white/40 group-hover:text-white transition-colors duration-500">
                {t('titleLine2')}
              </span>
            </h1>
          </div>

          <p className="max-w-md text-slate-400 text-lg font-medium leading-relaxed border-l-2 border-[#E84142]/30 pl-6">
            {t('description')}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4">
            {/* Bouton principal */}
            <Link
              href={`/${locale}/user-terminal`}
              className="px-8 py-4 bg-[#E84142] text-white rounded-2xl font-bold hover:bg-[#ff4d4d] hover:shadow-[0_0_30px_-5px_rgba(232,65,66,0.5)] transition-all flex items-center gap-2 group cursor-pointer"
            >
              {t('buttonMain')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Yield Card */}
            <div className="px-6 py-3 glass-card border border-white/10 backdrop-blur-xl rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] text-[#E84142] font-black uppercase tracking-widest">
                {t('yieldLabel')}
              </span>
              <span className="text-2xl font-black text-white">+7.42%</span>
            </div>
          </div>
        </div>

        {/* ANIMATED SPRITE HERO */}
        <div className="relative lg:absolute lg:right-0 lg:top-0 w-full lg:w-1/2 h-[70vh] lg:h-[110%] z-10 pointer-events-none">
          <AnimatedHero />
        </div>
      </div>
    </section>
  );
}