'use client';
import { useTranslations } from 'next-intl';
import { Wallet, Building2, ShoppingCart, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HowItWorks() {
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const saved = document.cookie.split('; ').find(row => row.startsWith('NEXT_LOCALE='))?.split('=')[1];
    if (saved) setLocale(saved);
  }, []);

  const t = useTranslations(locale === 'en' ? 'en.howItWorks' : 'howItWorks');

  const steps = [
    { icon: <Wallet />, key: 'step1' },
    { icon: <Building2 />, key: 'step2' },
    { icon: <ShoppingCart />, key: 'step3' },
    { icon: <TrendingUp />, key: 'step4' },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#020617] relative z-0">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#020617] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            {t('title')}
          </h2>
          <div className="w-24 h-1.5 bg-blue-500 mx-auto rounded-full" />
        </div>
              
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-blue-500/50 hover:bg-white/[0.04] transition-all duration-300 group overflow-hidden">
              {/* Numéro en arrière-plan pour le style */}
              <span className="absolute -right-4 -bottom-4 text-9xl font-black text-white/[0.02] group-hover:text-blue-500/[0.05] transition-colors">
                {index + 1}
              </span>

              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                {step.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4 relative z-10">
                {t(`${step.key}.title`)}
              </h3>
              
              <p className="text-slate-400 leading-relaxed relative z-10 group-hover:text-slate-300 transition-colors">
                {t(`${step.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}