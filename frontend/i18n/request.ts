import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // On force une valeur sûre pour le build statique
  const activeLocale = locale || 'fr';

  // 1. On charge le fichier principal (fr.json ou en.json)
  const mainMessages = (await import(`../messages/${activeLocale}.json`)).default;

  // 2. On charge le fichier spécifique à Bob (fr_bob.json ou en_bob.json)
  const bobMessages = (await import(`../messages/${activeLocale}_bob.json`)).default;
  const jordanMessages = (await import(`../messages/${activeLocale}_jordan.json`)).default;

  // 3. NPC Supplémentaires
  const doraMessages = (await import(`../messages/${activeLocale}_dora.json`)).default;
  const conanMessages = (await import(`../messages/${activeLocale}_conan.json`)).default;
  const caroleMessages = (await import(`../messages/${activeLocale}_carole.json`)).default;

  return {
    locale: activeLocale,
    messages: {
      ...mainMessages, // On étale toutes tes traductions générales à la racine
      bob: bobMessages, // On ajoute le tiroir "bob" qui contient ses dialogues
      jordan: jordanMessages,
      dora: doraMessages,
      conan: conanMessages,
      carole: caroleMessages
    }
  };
});