'use client';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

// 1. Définition des types pour les Props
interface NavbarLandingProps {
  address?: `0x${string}`;
  usdcBalance?: string;
  isFaucetLoading?: boolean;
  onClaimUSDC?: () => Promise<void>;
  currentView?: any; // Remplacez 'any' par votre type ViewType si disponible
  onNavigate?: Dispatch<SetStateAction<any>>;
}

// 2. Application des props au composant
export default function NavbarLanding({
  address,
  usdcBalance,
  isFaucetLoading,
  onClaimUSDC,
}: NavbarLandingProps) {
  const [scrolled, setScrolled] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logoGlow = logoHovered
    ? 'drop-shadow-[0_0_10px_rgba(232,65,66,0.6)] brightness-125 scale-110'
    : 'drop-shadow-[0_0_4px_rgba(232,65,66,0.4)] brightness-110';

  return (
    <nav
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${
        scrolled ? 'w-fit scale-95' : 'w-fit min-w-[320px] md:min-w-[450px]'
      }`}
    >
      <div className="relative group">
        <div
          className="absolute -inset-[1.5px] bg-gradient-to-r from-[#E84142]/30 via-[#E84142]/10 to-[#E84142]/30 
                     rounded-full blur-[2px] opacity-15 group-hover:opacity-30 transition-opacity duration-700 animate-gradient-x pointer-events-none"
        />

        <div className="relative flex items-center gap-4 px-4 py-2 rounded-full bg-[#020617]/12 backdrop-blur-2xl border border-white/5 shadow-xl">
          {/* LOGO */}
          <div
            onClick={handleLogoClick}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            className="flex items-center gap-2 pl-1 cursor-pointer transition-transform active:scale-95 group/logo"
          >
            <div className="relative w-6 h-6">
              <Image
                src="/logo.svg"
                alt="EcoRWA Tycoon Logo"
                fill
                className={`object-contain transition-all duration-300 ${logoGlow}`}
              />
            </div>

            {!scrolled && (
              <span className="text-white font-black tracking-tighter text-xs uppercase hidden sm:block transition-all duration-300 group-hover/logo:text-[#E84142]/90">
                EcoRWA{' '}
                <span className="bg-gradient-to-r from-[#E84142] to-[#FF6B6B] bg-clip-text text-transparent">
                  Tycoon
                </span>
              </span>
            )}
          </div>

          {/* Navigation */}
          {!scrolled && (
            <div className="hidden md:flex items-center gap-5 border-l border-white/10 pl-5 text-[10px] font-bold text-slate-400">
              <a href="#how-it-works" className="hover:text-white transition-colors uppercase tracking-widest">
                {t('howItWorks')}
              </a>
              <a href="#market" className="hover:text-white transition-colors uppercase tracking-widest">
                {t('market')}
              </a>
            </div>
          )}

          <div className="flex items-center gap-4 ml-auto">
            {/* Affichage du solde ou de l'adresse si nécessaire ici */}
            {address && (
                <span className="text-[9px] text-slate-500 font-mono hidden lg:block">
                    {address.slice(0,6)}...{address.slice(-4)}
                </span>
            )}

            <div className="scale-90 origin-right">
              <LanguageSwitcher />
            </div>

            {/* Bouton principal */}
            <button 
                onClick={onClaimUSDC}
                disabled={isFaucetLoading}
                className="relative group/btn p-[1px] rounded-full overflow-hidden transition-transform active:scale-95 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#E84142] via-[#FF394A] to-[#E84142] 
                              opacity-60 group-hover/btn:opacity-100 animate-gradient-x transition-opacity duration-500" />
              <div className="relative px-5 py-2 bg-[#020617]/70 rounded-full backdrop-blur-lg">
                <span className="text-white text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap">
                  {isFaucetLoading ? '...' : tHero('buttonMain')}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}