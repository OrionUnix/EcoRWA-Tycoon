import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // On force une valeur sûre pour le build statique
  const activeLocale = locale || 'fr';
  
  return {
    locale: activeLocale,
    messages: (await import(`../messages/${activeLocale}.json`)).default
  };
});