'use client';
import { useScroll, useTransform, motion } from 'framer-motion';
import NavbarLanding from '@/components/landing/NavbarLanding';
import HowItWorks from '@/components/landing/HowItWorks';
import HeroSection from '@/components/landing/HeroSection';
import PropertiesSection from '@/components/landing/PropertiesSection';
import MarketAnalysis from '@/components/landing/MarketAnalysis'; // Tes cartes de stratégie
import InfoMarket from '@/components/landing/InfoMarket';       // Tes graphiques Paris/NY
import Footer from './Footer';
interface LandingPageProps {
  onGetStarted: () => Promise<void>; 
  address?: `0x${string}`;
  usdcBalance?: string;
  isFaucetLoading?: boolean;
}

export default function LandingPage({ 
  onGetStarted, 
  address, 
  usdcBalance, 
  isFaucetLoading 
}: LandingPageProps) {
  const { scrollYProgress } = useScroll();
  
  const opacityHero = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.15], [1, 0.9]);

  return (
    <main className="relative bg-[#020617] min-h-screen selection:bg-[#E84142]/30">
      <NavbarLanding 
        address={address}
        usdcBalance={usdcBalance}
        isFaucetLoading={isFaucetLoading}
        onClaimUSDC={onGetStarted} 
      />

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <motion.div style={{ opacity: opacityHero, scale: scaleHero }} className="h-full w-full">
          <HeroSection />
        </motion.div>
      </section>

      {/* Contenu de la Landing */}
      <div className="relative z-30 bg-[#020617]">
        
        <section id="how-it-works" className="py-20 border-t border-white/5">
          <HowItWorks />
        </section>

        <section id="properties" className="py-20 bg-black/20">
          <PropertiesSection />
        </section>

        <MarketAnalysis />
        <InfoMarket />

      </div>

      <Footer />
    </main>
  );
}