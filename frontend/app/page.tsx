'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi'; // Ou ta méthode de connexion
import LandingPage from '@/components/LandingPage';

export default function Page() {
  const { address, isConnected } = useAccount();
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState('0.0');

  const handleGetStarted = async () => {
    if (!isConnected) {
      alert("Veuillez connecter votre wallet");
      return;
    }
    
    setIsFaucetLoading(true);
    try {
      // Simule un appel contrat/faucet
      console.log("Claiming USDC for", address);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUsdcBalance('1000.0');
    } catch (error) {
      console.error("Erreur faucet:", error);
    } finally {
      setIsFaucetLoading(false);
    }
  };

  return (
    <LandingPage 
      locale="fr"
      onGetStarted={handleGetStarted}
      address={address}
      usdcBalance={usdcBalance}
      isFaucetLoading={isFaucetLoading}
    />
  );
}