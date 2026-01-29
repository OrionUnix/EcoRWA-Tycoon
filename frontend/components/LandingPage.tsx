'use client';
import NavbarLanding from '@/components/landing/NavbarLanding';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
// AJOUT DE L'IMPORT MANQUANT
import { useTranslations } from 'next-intl'; 

interface LandingPageProps {
  onGetStarted: () => void;
  locale: 'fr' | 'en';
}

export default function LandingPage({ onGetStarted, locale }: LandingPageProps) {
  // Cette ligne fonctionne maintenant, mais assure-toi d'en avoir besoin ici
  const t = useTranslations(locale === 'en' ? 'en.Hero' : 'Hero');
  
  return (
    <main className="min-h-screen bg-[#020617]">
      <NavbarLanding />
      <HeroSection />
      <HowItWorks />
      {/* Si tu veux utiliser onGetStarted, tu peux le passer à un bouton ici ou plus bas */}
    </main>
  );
}