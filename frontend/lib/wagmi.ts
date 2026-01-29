import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalancheFuji } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

if (!projectId) {
  throw new Error('Le Project ID WalletConnect est manquant dans .env.local');
}

export const config = getDefaultConfig({
  appName: 'Parse City',
  projectId: projectId,
  chains: [avalancheFuji],
  ssr: true,
});