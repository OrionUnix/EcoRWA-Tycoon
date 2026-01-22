'use client';
import { Card } from '@/components/ui/card';
import { Wallet, Search, MousePointer2, TrendingUp } from 'lucide-react';

export default function StepSection({ locale }: { locale: 'fr' | 'en' }) {
  const content = {
    fr: [
      { title: 'Faucet', desc: 'Récupérez vos jetons de test.' },
      { title: 'Explorez', desc: 'Trouvez des opportunités en 3D.' },
      { title: 'Investissez', desc: 'Achetez des parts certifiées.' },
      { title: 'Rendement', desc: 'Encaissez vos yields RWA.' },
    ],
    en: [
      { title: 'Faucet', desc: 'Get your test tokens.' },
      { title: 'Explore', desc: 'Find opportunities in 3D.' },
      { title: 'Invest', desc: 'Buy certified shares.' },
      { title: 'Yield', desc: 'Collect your RWA yields.' },
    ]
  }[locale];

  return (
    <section className="py-24 bg-[#020617] border-t border-white/5">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {content.map((step, i) => (
          <div key={i} className="text-center">
             <h3 className="text-white font-bold mb-1">{step.title}</h3>
             <p className="text-slate-500 text-sm">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}