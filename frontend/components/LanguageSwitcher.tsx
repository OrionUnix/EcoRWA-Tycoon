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
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);

    // On met à jour le cookie pour que next-intl s'en souvienne
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // On navigue vers la nouvelle page
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage('fr')}
        className={`px-3 py-2 text-xs font-black uppercase tracking-widest transition-none border-2 border-black rounded-none ${currentLocale === 'fr'
          ? 'bg-slate-400 text-black translate-y-[2px] translate-x-[2px] shadow-none'
          : 'bg-slate-200 text-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-slate-300'
          }`}
      >
        FR
      </button>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-2 text-xs font-black uppercase tracking-widest transition-none border-2 border-black rounded-none ${currentLocale === 'en'
          ? 'bg-slate-400 text-black translate-y-[2px] translate-x-[2px] shadow-none'
          : 'bg-slate-200 text-black shadow-[4px_4px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-slate-300'
          }`}
      >
        EN
      </button>
    </div>
  );
}