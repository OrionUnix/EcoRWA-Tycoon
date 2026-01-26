// frontend/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EcoRWA Tycoon - Gamified Real World Assets',
  description: 'SimCity meets Real Estate Investment on Avalanche',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <LanguageProvider>
            <Navbar />
            <main>{children}</main>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}