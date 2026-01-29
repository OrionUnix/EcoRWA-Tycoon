import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Web3Providers } from '@/components/providers/Web3Providers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

// ON SUPPRIME force-dynamic ICI car c'est interdit en export statique

export const metadata = {
  title: 'EcoRWA Tycoon',
  description: 'Gamify Real Estate with RWA',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // On récupère le pack de messages (FR + EN fusionnés via request.ts)
  const messages = await getMessages();
  
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-[#020617] selection:bg-blue-500/30`}>
        {/* On passe "fr" par défaut, mais le client pourra switcher sur le namespace "en" */}
        <NextIntlClientProvider messages={messages} locale="fr">
          <Web3Providers>
            <main className="relative min-h-screen">
              {children}
            </main>
          </Web3Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}