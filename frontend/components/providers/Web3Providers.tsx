'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { ReactNode, useState } from 'react';

// 1. On définit le QueryClient à l'extérieur pour éviter de le recréer
// Cela stabilise le rendu sous les 200ms
const globalQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

export function Web3Providers({ children }: { children: ReactNode }) {
  // On utilise un état pour l'hydratation côté client uniquement
  const [queryClient] = useState(() => globalQueryClient);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* On ajoute un thème pour alléger le calcul CSS de RainbowKit */}
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#3b82f6',
          borderRadius: 'large',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}