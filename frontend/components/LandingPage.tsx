'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Cpu, ChevronDown, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';

// 1. On déplace l'import dynamique HORS du composant
// Cela règle le problème de performance et de définition
const BuildingHero = dynamic(() => import('./landing/BuildingHero'), { 
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
});

export default function LandingPage({ onGetStarted, locale: initialLocale = 'fr' }: any) {
  // 2. On renomme la prop en 'initialLocale' pour pouvoir utiliser 'locale' dans le state
  const [locale, setLocale] = useState(initialLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = {
    fr: {
      tag: "Avalanche Fuji Testnet",
      title: "L'immobilier réel,",
      subtitle: "version Gamifiée.",
      desc: "Ne vous contentez pas d'investir. Gérez votre empire immobilier en 3D sur la blockchain. Simple, sécurisé, et accessible dès 50$.",
      cta: "Lancer l'App",
      nav: ["Marché", "Concept", "Sécurité"]
    },
    en: {
      tag: "Avalanche Fuji Testnet",
      title: "Real Estate,",
      subtitle: "Gamified.",
      desc: "Don't just invest. Manage your real estate empire in 3D on the blockchain. Simple, secure, and accessible from $50.",
      cta: "Launch App",
      nav: ["Market", "Concept", "Security"]
    }
  }[locale as 'fr' | 'en'] || {
    // Fallback de sécurité
    tag: "", title: "", subtitle: "", desc: "", cta: "", nav: []
  };

  // On attend que le composant soit monté pour éviter les erreurs d'hydratation (SSR)
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-6 inset-x-0 z-50 flex justify-center px-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 flex items-center gap-8 max-w-5xl w-full justify-between shadow-2xl">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span>Eco<span className="text-blue-400">RWA</span></span>
          </div>
          
          <div className="hidden md:flex gap-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
             {t.nav.map(item => <button key={item} className="hover:text-white transition-colors">{item}</button>)}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')} 
              className="text-xs font-black px-3 py-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              {locale.toUpperCase()}
            </button>
            <Button onClick={onGetStarted} className="rounded-full bg-blue-600 hover:bg-blue-700 font-bold px-6 shadow-lg shadow-blue-600/20">
              {t.cta}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 min-h-screen flex flex-col items-center justify-center">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full -z-10" />

        <div className="container max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-start space-y-10 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black tracking-widest uppercase">
              <ShieldCheck className="w-4 h-4" /> {t.tag}
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter">
              {t.title} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                {t.subtitle}
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-md leading-relaxed font-medium">
              {t.desc}
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
              <Button 
                onClick={onGetStarted}
                className="h-16 px-12 rounded-3xl bg-white text-black hover:bg-blue-50 text-xl font-black transition-all hover:scale-105 hover:rotate-1 active:scale-95 shadow-xl shadow-white/10"
              >
                {t.cta} <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
              
              <div className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl group transition-all hover:bg-white/10">
                <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-black uppercase text-slate-500 tracking-tighter">
                    {locale === 'fr' ? 'Rendement Moyen' : 'Avg Yield'}
                  </div>
                  <div className="text-xl font-black text-white">+7.42%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone 3D - Aura bleue fusionnée */}
         <div className="relative order-1 lg:order-2 h-[600px] w-full flex items-end justify-center">
            {/* Halo de lumière qui brille à travers le Canvas transparent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
            
            {/* Appel du composant dynamique sans SSR */}
            <BuildingHero />


          </div>
        </div>

        <div className="mt-20 animate-bounce opacity-20">
          <ChevronDown className="w-10 h-10" />
        </div>
      </section>
    </div>
  );
}