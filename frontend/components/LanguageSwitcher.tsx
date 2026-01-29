'use client';
import { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const saved = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'fr';
    setLocale(saved);
  }, []);

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    setLocale(newLocale);
    window.location.reload();
  };

  return (
    <div className="flex items-center bg-[#020617]/30 border border-white/10 rounded-full p-0.5 backdrop-blur-sm">
      <button
        onClick={() => switchLanguage('fr')}
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
          locale === 'fr'
            ? 'bg-[#E84142]/80 text-white shadow-sm shadow-[#E84142]/40'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
          locale === 'en'
            ? 'bg-[#E84142]/80 text-white shadow-sm shadow-[#E84142]/40'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        EN
      </button>
    </div>
  );
}