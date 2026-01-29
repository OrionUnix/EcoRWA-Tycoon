import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  try {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'fr';

    // On utilise les messages en dur pour éviter les erreurs de lecture de fichiers
    const messages = {
      fr: {
        Hero: {
          badge: "Avalanche Fuji Testnet",
          titleLine1: "L'immobilier",
          titleLine2: "Gamifié.",
          description: "Gérez votre empire immobilier en 3D sur la blockchain.",
          buttonMain: "Lancer l'App",
          yieldLabel: "Rendement Moyen"
        }
      },
      en: {
        Hero: {
          badge: "Avalanche Fuji Testnet",
          titleLine1: "Real Estate",
          titleLine2: "Gamified.",
          description: "Manage your real estate empire in 3D on the blockchain.",
          buttonMain: "Launch App",
          yieldLabel: "Avg Yield"
        }
      }
    };

    return {
      locale,
      messages: locale === 'en' ? messages.en : messages.fr
    };
  } catch (error) {
    // Fallback de sécurité pour éviter le [object Object]
    return {
      locale: 'fr',
      messages: {} 
    };
  }
});