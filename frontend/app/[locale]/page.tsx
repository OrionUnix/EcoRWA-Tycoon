'use client';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import LandingPage from '@/components/LandingPage';

export default function Page() {
  const { address, isConnected } = useAccount();
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState('0.0');

  const handleGetStarted = async () => {
    if (!isConnected) return;
    setIsFaucetLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUsdcBalance('1000.0');
    } finally {
      setIsFaucetLoading(false);
    }
  };

  return (
    <LandingPage 
      onGetStarted={handleGetStarted}
      address={address}
      usdcBalance={usdcBalance}
      isFaucetLoading={isFaucetLoading}
    />
  );
}