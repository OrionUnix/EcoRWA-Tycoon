import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Web3Providers } from '@/components/providers/Web3Providers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

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
      <body className="antialiased bg-[#020617]">
        {/* On enveloppe tout dans le provider de traduction */}
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Web3Providers>
            {children}
          </Web3Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}