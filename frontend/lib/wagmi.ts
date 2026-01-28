import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalancheFuji } from 'wagmi/chains';

// Use a singleton to avoid "WalletConnect Core already initialized" warnings
const getWagmiConfig = () => {
  if (typeof window !== 'undefined' && (globalThis as any).wagmiConfig) {
    return (globalThis as any).wagmiConfig;
  }

  const wagmiConfig = getDefaultConfig({
    appName: 'Parse City',
    projectId: '3fbb6bba6f1de962d911bb5b5c9dba88',
    chains: [avalancheFuji],
    ssr: true,
  });

  if (typeof window !== 'undefined') {
    (globalThis as any).wagmiConfig = wagmiConfig;
  }

  return wagmiConfig;
};

export const config = getWagmiConfig();