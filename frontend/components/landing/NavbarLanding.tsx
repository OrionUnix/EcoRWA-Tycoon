'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher'; // Ajuste le chemin si besoin

export default function NavbarLanding() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-[100]">
      <div className="bg-[#020617]/40 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center justify-between shadow-2xl">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
             <span className="text-white font-black text-xs">P</span>
          </div>
          <span className="text-white font-black tracking-tighter text-sm hidden sm:block">EcoRWA</span>
        </div>

        {/* Navigation Centrale - Desktop */}
        <div className="hidden md:flex items-center gap-8 text-[13px] font-bold text-slate-400">
          <a href="#market" className="hover:text-white transition-colors">Market</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#blog" className="hover:text-white transition-colors">Blog</a>
        </div>

        {/* Actions Droite */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          
          <button className="bg-white text-black text-[12px] font-black px-5 py-2 rounded-full hover:scale-105 transition-all active:scale-95">
            Try now
          </button>
          
          <button className="md:hidden text-white p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#020617]/95 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 flex flex-col gap-6 md:hidden animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Navigation</span>
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col gap-4">
            <a href="#market" className="text-white font-black text-2xl">Market</a>
            <a href="#about" className="text-white font-black text-2xl">About</a>
            <a href="#blog" className="text-white font-black text-2xl">Blog</a>
          </div>
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg shadow-xl shadow-white/5">
            Try now
          </button>
        </div>
      )}
    </nav>
  );
}