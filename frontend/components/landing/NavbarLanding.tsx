'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation'
interface NavbarLandingProps {
  address?: string;
  usdcBalance?: string;
  isFaucetLoading?: boolean;
  onClaimUSDC?: () => void;
}

export default function NavbarLanding({
  address,
  usdcBalance,
  isFaucetLoading,
  onClaimUSDC,
}: NavbarLandingProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  // 2. LANGUE
  const locale = useLocale();
  const t = useTranslations('Navbar');
  const tHero = useTranslations('Hero');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logoGlow = logoHovered
    ? 'drop-shadow-[0_0_10px_rgba(232,65,66,0.6)] brightness-125 scale-110'
    : 'drop-shadow-[0_0_4px_rgba(232,65,66,0.4)] brightness-110';

  const handleAction = async () => {
    // 1. On déclenche l'action de base (faucet) si elle existe
    if (onClaimUSDC) {
      await onClaimUSDC();
    }
    // On utilise le locale pour garder la bonne langue dans l'URL
    router.push(`/${locale}/user-terminal`);
  };

  return (
    <nav
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${scrolled ? 'scale-95 py-1.5 px-3 min-w-[280px]' : 'py-2 px-4 min-w-[320px] md:min-w-[450px]'
        }`}
    >
      <div className="relative group">
        <div className="absolute -inset-[1.5px] bg-gradient-to-r from-[#E84142]/30 via-[#E84142]/10 to-[#E84142]/30 rounded-full blur-[2px] opacity-15 group-hover:opacity-30 transition-opacity duration-700 animate-gradient-x pointer-events-none" />

        <div className="relative flex items-center gap-4 md:gap-6 rounded-full bg-[#020617]/12 backdrop-blur-2xl border border-white/5 shadow-xl">
          {/* LOGO */}
          <div
            onClick={handleLogoClick}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            className="flex items-center gap-2 pl-1 md:pl-2 cursor-pointer transition-transform active:scale-95 group/logo"
          >
            <div className="relative w-5 h-5 md:w-6 md:h-6">
              <Image
                src={withBasePath("/logo.svg")}
                alt="Logo"
                fill
                className={`object-contain transition-all duration-300 ${logoGlow}`}
              />
            </div>

            <span
              className={`text-white font-black tracking-tighter uppercase hidden sm:block transition-all duration-300 ${scrolled ? 'text-[10px]' : 'text-xs'
                } group-hover/logo:text-[#E84142]/90`}
            >
              EcoRWA{' '}
              <span className="bg-gradient-to-r from-[#E84142] to-[#FF6B6B] bg-clip-text text-transparent">
                Tycoon
              </span>
            </span>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-4 md:gap-6 border-l border-white/10 pl-4 md:pl-6 text-[9px] md:text-[10px] font-bold text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition-colors uppercase tracking-widest">
              {t('howItWorks')}
            </a>
            <a href="#market" className="hover:text-white transition-colors uppercase tracking-widest">

              {t('market') || 'RWA Listings'}
            </a>
            <a href="#market-analysis" className="hover:text-white transition-colors uppercase tracking-widest">
              {t('market-analysis') || 'Analysis'}
            </a>
            <a href="#Info-analysis" className="hover:text-white transition-colors uppercase tracking-widest">
              {t('Info-analysis') || 'Key Figure'}
            </a>
          </div>

          <div className="flex items-center gap-3 md:gap-4 ml-auto pr-1 md:pr-2">
            {address && (
              <span className="text-[9px] text-slate-500 font-mono hidden lg:block">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            )}

            <div className="scale-90 md:scale-100 origin-right">
              <LanguageSwitcher />
            </div>

            <button
              onClick={handleAction}
              disabled={isFaucetLoading}
              className="relative group/btn p-[1px] rounded-full overflow-hidden transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >

              <div className="absolute inset-0 bg-gradient-to-r from-[#E84142] via-[#FF394A] to-[#E84142] opacity-60 group-hover/btn:opacity-100 animate-gradient-x transition-opacity duration-500" />
              <div className="relative px-4 py-1.5 md:px-5 md:py-2 bg-[#020617]/70 rounded-full backdrop-blur-lg">
                <span className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap">
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