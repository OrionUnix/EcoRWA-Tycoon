import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Web3Providers } from '@/components/providers/Web3Providers';

export const metadata = {
  title: 'EcoRWA Tycoon',
  description: 'Gamify Real Estate with RWA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <Web3Providers>
          {children}
        </Web3Providers>
      </body>
    </html>
  );
}