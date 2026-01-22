'use client';

import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
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
    <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg p-1">
      <Button
        variant={locale === 'fr' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => switchLanguage('fr')}
        className="h-8"
      >
        🇫🇷 FR
      </Button>
      <Button
        variant={locale === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => switchLanguage('en')}
        className="h-8"
      >
        🇬🇧 EN
      </Button>
    </div>
  );
}