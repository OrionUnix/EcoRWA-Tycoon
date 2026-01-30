'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const switchLanguage = (newLocale: string) => {
    if (newLocale === currentLocale) return;

    // On remplace le préfixe de la langue dans l'URL actuelle
    // Exemple: /fr/marketplace -> /en/marketplace
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    
    // On met à jour le cookie pour que next-intl s'en souvienne
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // On navigue vers la nouvelle page
    router.push(newPath);
  };

  return (
    <div className="flex items-center bg-[#020617]/30 border border-white/10 rounded-full p-0.5 backdrop-blur-sm">
      <button
        onClick={() => switchLanguage('fr')}
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
          currentLocale === 'fr'
            ? 'bg-[#E84142] text-white shadow-sm shadow-[#E84142]/40'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
          currentLocale === 'en'
            ? 'bg-[#E84142] text-white shadow-sm shadow-[#E84142]/40'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        EN
      </button>
    </div>
  );
}