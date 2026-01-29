'use client';
import { useScroll, useTransform, motion } from 'framer-motion';
import NavbarLanding from '@/components/landing/NavbarLanding';
import HowItWorks from '@/components/landing/HowItWorks';
import HeroSection from '@/components/landing/HeroSection';
import PropertiesSection from '@/components/landing/PropertiesSection';

interface LandingPageProps {
  // On change () => void en () => Promise<void> pour matcher la Navbar
  onGetStarted: () => Promise<void>; 
  locale: 'fr' | 'en';
  address?: `0x${string}`;
  usdcBalance?: string;
  isFaucetLoading?: boolean;
}

export default function LandingPage({ 
  onGetStarted, 
  locale, 
  address, 
  usdcBalance, 
  isFaucetLoading 
}: LandingPageProps) {
  const { scrollYProgress } = useScroll();
  
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <main className="relative bg-[#020617] min-h-screen">
      <NavbarLanding 
        address={address}
        usdcBalance={usdcBalance}
        isFaucetLoading={isFaucetLoading}
        onClaimUSDC={onGetStarted} 
      />

      <section className="relative h-screen overflow-hidden">
        <motion.div 
          style={{ opacity: opacityHero, scale: scaleHero }}
          className="h-full w-full"
        >
          <HeroSection />
        </motion.div>
      </section>

      <section className="relative z-30 bg-[#020617]">
        <HowItWorks />
      </section>

      <section className="relative z-30 bg-[#020617]" >
      <PropertiesSection />
      </section>
    </main>
  );
}