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
    { icon: <Wallet className="w-6 h-6" />, key: 'step1' },
    { icon: <Building2 className="w-6 h-6" />, key: 'step2' },
    { icon: <ShoppingCart className="w-6 h-6" />, key: 'step3' },
    { icon: <TrendingUp className="w-6 h-6" />, key: 'step4' },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#020617] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-16 tracking-tighter">
          {t('title')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {t(`${step.key}.title`)}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {t(`${step.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}