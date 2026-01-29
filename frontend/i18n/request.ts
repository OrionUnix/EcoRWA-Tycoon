import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Importation des deux fichiers
  const fr = (await import(`../messages/fr.json`)).default;
  const en = (await import(`../messages/en.json`)).default;

  return {
    locale: 'fr',
    messages: {
      // On met le français à la racine pour que t('Hero') fonctionne par défaut
      ...fr, 
      // On garde l'anglais dans un namespace 'en'
      en: en
    }
  };
});