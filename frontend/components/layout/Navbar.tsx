'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function NavbarLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const saved = document.cookie.split('; ').find(row => row.startsWith('NEXT_LOCALE='))?.split('=')[1];
    if (saved) setLocale(saved);
    
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = useTranslations(locale === 'en' ? 'en.Navbar' : 'Navbar');
  const tHero = useTranslations(locale === 'en' ? 'en.Hero' : 'Hero');

  return (
    <nav className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${scrolled ? 'w-fit' : 'w-fit min-w-[320px] md:min-w-[500px]'}`}>
      <div className="relative">
        
        {/* CONTOUR SIRY NAVBAR (PLUS DISCRET) */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-[#E84142]/40 via-[#3B82F6]/40 to-[#FFA726]/40 rounded-full blur-[2px] animate-gradient-x" />

        <div className="relative flex items-center gap-4 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-2xl border border-white/10 shadow-2xl">
          
          {/* LOGO AVEC GLOW EMERAUDE/BLUE */}
          <div className="flex items-center gap-3 pl-1">
            <div className="relative w-8 h-8 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg blur opacity-40 group-hover:opacity-70 transition-opacity" />
              <div className="relative w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Image 
                  src="/logo.svg" 
                  alt="EcoRWA Logo" 
                  width={18}
                  height={18}
                  className="brightness-0 invert"
                />
              </div>
            </div>
            {!scrolled && (
              <div className="hidden md:block leading-none">
                <h1 className="text-[13px] font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent uppercase tracking-tighter">
                  EcoRWA
                </h1>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Tycoon</p>
              </div>
            )}
          </div>

          {/* NAV LINKS */}
          {!scrolled && (
            <div className="hidden lg:flex items-center gap-4 border-l border-white/10 pl-4 text-[9px] font-bold text-slate-400">
              <a href="#how-it-works" className="hover:text-white transition-colors uppercase tracking-widest">{t('howItWorks')}</a>
              <a href="#market" className="hover:text-white transition-colors uppercase tracking-widest">{t('market')}</a>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="scale-75 origin-right">
              <LanguageSwitcher />
            </div>
            
            {/* BOUTON AVEC CONTOUR RÉPARÉ (SANS DÉBORDEMENT) */}
            <div className="relative p-[1px] rounded-full overflow-hidden group/btn">
              {/* Le contour est enfermé dans ce div par overflow-hidden */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#E84142] via-[#3B82F6] to-[#FFA726] animate-gradient-x opacity-70 group-hover/btn:opacity-100" />
              
              <button className="relative px-4 py-1.5 bg-[#020617] rounded-full backdrop-blur-md transition-transform active:scale-95">
                <span className="text-white text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                  {tHero('buttonMain')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}