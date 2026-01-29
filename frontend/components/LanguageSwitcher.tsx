'use client';
import { useState, useEffect } from 'react';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'fr';
    setLocale(savedLocale);
  }, []);

const switchLanguage = (newLocale: string) => {
  document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
  setLocale(newLocale);
  window.location.reload(); 
};

  return (
    <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5">
      <button
        onClick={() => switchLanguage('fr')}
        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
          locale === 'fr' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
          locale === 'en' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  );
}