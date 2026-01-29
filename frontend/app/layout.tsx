import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Web3Providers } from '@/components/providers/Web3Providers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';

// Utilisation d'une police optimisée pour réduire le Layout Shift
const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'EcoRWA Tycoon',
  description: 'Gamify Real Estate with RWA',
};

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Récupération des messages i18n côté serveur
  const messages = await getMessages();

  return (
    <html lang={locale || "fr"} suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-[#020617] selection:bg-blue-500/30`}>
        {/* NextIntlClientProvider est léger car il ne fait que passer un contexte */}
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/* Web3Providers contient la logique lourde, il doit être isolé */}
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