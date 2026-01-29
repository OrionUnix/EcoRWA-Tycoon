'use client';
import { useScroll, useTransform, motion } from 'framer-motion';
import NavbarLanding from '@/components/landing/NavbarLanding';
import HowItWorks from '@/components/landing/HowItWorks';
import HeroSection from '@/components/landing/HeroSection';

// 1. Définir le type des props
interface LandingPageProps {
  onGetStarted: () => void;
  locale: 'fr' | 'en';
}

// 2. Appliquer le type au composant
export default function LandingPage({ onGetStarted, locale }: LandingPageProps) {
  const { scrollYProgress } = useScroll();
  
  const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const yHero = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  return (
    <main className="relative bg-[#020617] overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full z-50">
        <NavbarLanding />
      </div>

      <section className="relative h-screen">
        <motion.div 
          style={{ opacity: opacityHero, y: yHero }}
          className="fixed top-0 left-0 h-screen w-full"
        >
          {/* Tu peux maintenant utiliser locale ou onGetStarted ici si besoin */}
          <HeroSection />
        </motion.div>
      </section>

      <section className="relative z-30 bg-[#020617] mt-[-10vh]">
        <HowItWorks />
      </section>
    </main>
  );
}