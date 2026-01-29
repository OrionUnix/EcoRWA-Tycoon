import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

// Traductions écrites en dur pour forcer le fonctionnement
const messagesData = {
  fr: {
    Hero: {
      badge: "Avalanche Fuji Testnet",
      titleLine1: "L'immobilier",
      titleLine2: "Gamifié.",
      description: "Gérez votre empire immobilier en 3D sur la blockchain. Simple, sécurisé et accessible dès 50$.",
      buttonMain: "Lancer l'App",
      yieldLabel: "Rendement Moyen"
    },
    nav: {
      marketplace: "Marché",
      about: "À propos"
    }
  },
  en: {
    Hero: {
      badge: "Avalanche Fuji Testnet",
      titleLine1: "Real Estate",
      titleLine2: "Gamified.",
      description: "Manage your real estate empire in 3D on the blockchain. Simple, secure, and accessible from $50.",
      buttonMain: "Launch App",
      yieldLabel: "Avg Yield"
    },
    nav: {
      marketplace: "Market",
      about: "About"
    }
  }
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'fr';

  return {
    locale,
    // On sélectionne l'objet local au lieu d'importer un fichier externe
    messages: locale === 'en' ? messagesData.en : messagesData.fr
  };
});