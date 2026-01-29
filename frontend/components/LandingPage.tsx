// LandingPage.tsx
import NavbarLanding from '@/components/landing/NavbarLanding'; // Nouveau composant
import HeroSection from '@/components/landing/HeroSection';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#020617]">
      <NavbarLanding />
      <HeroSection />
      {/* Autres sections... */}
    </main>
  );
}