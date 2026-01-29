'use client';
import { useState, useEffect } from 'react';
import { Menu, X, Rocket } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

export default function NavbarLanding() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    // Détection de la langue via cookie pour le client
    const saved = document.cookie.split('; ').find(row => row.startsWith('NEXT_LOCALE='))?.split('=')[1];
    if (saved) setLocale(saved);
    
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // On pointe vers "Navbar" ou "en.Navbar" selon ton JSON
  const t = useTranslations(locale === 'en' ? 'en.Navbar' : 'Navbar');
  const tHero = useTranslations(locale === 'en' ? 'en.Hero' : 'Hero');

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${scrolled ? 'w-[90%] max-w-4xl' : 'w-[95%] max-w-5xl'}`}>
      <div className={`flex items-center justify-between px-2 py-2 rounded-full border border-white/10 transition-all ${scrolled ? 'bg-black/60 backdrop-blur-2xl shadow-xl' : 'bg-[#020617]/40 backdrop-blur-md'}`}>
        
        {/* Logo */}
        <div className="flex items-center gap-2 pl-3">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center rotate-3 shadow-lg shadow-blue-500/20">
             <Rocket size={16} className="text-white -rotate-12" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-black tracking-tighter text-sm uppercase">EcoRWA</span>
            <span className="text-blue-400 font-bold text-[9px] tracking-widest uppercase">Tycoon</span>
          </div>
        </div>

        {/* Liens traduits avec les clés de ton JSON */}
        <div className="hidden md:flex items-center gap-6 text-[12px] font-bold text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors py-2 px-3 hover:bg-white/5 rounded-full">{t('howItWorks')}</a>
          <a href="#market" className="hover:text-white transition-colors py-2 px-3 hover:bg-white/5 rounded-full">{t('market')}</a>
          <a href="#governance" className="hover:text-white transition-colors py-2 px-3 hover:bg-white/5 rounded-full">{t('dao')}</a>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block scale-90">
            <LanguageSwitcher />
          </div>
          
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black px-5 py-2.5 rounded-full shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2">
            {tHero('buttonMain')}
          </button>
          
          <button className="md:hidden text-white p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}