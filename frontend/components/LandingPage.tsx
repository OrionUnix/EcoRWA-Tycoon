// LandingPage.tsx
import NavbarLanding from '@/components/landing/NavbarLanding'; // Nouveau composant
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';


export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#020617]">
      <NavbarLanding />
      <HeroSection />
      <HowItWorks />
      {/* Autres sections... */}
    </main>
  );
}