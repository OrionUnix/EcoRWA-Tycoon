'use client';
import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
// Commentez la ligne ci-dessous tant que le fichier n'est pas créé
// import Footer from '@/components/layout/Footer'; 

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#020617] flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <HeroSection />
      </div>
      {/* <Footer /> */}
    </main>
  );
}