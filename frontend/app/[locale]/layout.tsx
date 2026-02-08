import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import { Web3Providers } from '@/components/providers/Web3Providers';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'fr' }
  ];
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-[#020617]`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
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