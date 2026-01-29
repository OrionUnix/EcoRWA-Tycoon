'use client';
import BuildingHero from './BuildingHero';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function HeroSection() {
  const t = useTranslations('Hero'); 

  return (
    <section className="relative min-h-[100dvh] w-full flex flex-col lg:flex-row items-center justify-between px-4 md:px-10 lg:px-20 pt-24 lg:pt-0 overflow-hidden bg-[#020617]">
      
      {/* TEXT CONTENT CONTAINER */}
      <div className="z-20 w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 md:space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          {t('badge')}
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white leading-[0.95] tracking-tighter">
          {t('titleLine1')}, <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            {t('titleLine2')}
          </span>
        </h1>

        <p className="max-w-[300px] sm:max-w-md text-slate-400 text-sm sm:text-base lg:text-xl font-medium">
          {t('description')}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
          <button className="w-full sm:w-auto px-6 py-3.5 bg-white text-black rounded-xl font-bold text-base hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-white/5">
            {t('buttonMain')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="px-5 py-2.5 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{t('yieldLabel')}</span>
            <span className="text-lg font-black text-white">+7.42%</span>
          </div>
        </div>
      </div>

      {/* 3D BUILDING CONTAINER */}
      <div className="relative w-full lg:w-1/2 h-[40vh] sm:h-[50vh] lg:h-screen flex items-center justify-center mt-4 lg:mt-0 overflow-hidden">
        <div className="absolute inset-0 w-full h-full transform scale-[0.9] sm:scale-100 lg:scale-[1.1]">
           <BuildingHero />
        </div>
        

      </div>

    </section>
  );
}