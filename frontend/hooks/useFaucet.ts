'use client';

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { useUSDCContract } from './useContract';
import { parseUnits } from 'viem';
import { useEffect } from 'react';

export function useFaucet() {
  const { address } = useAccount();
  const usdc = useUSDCContract();

  const { 
    writeContract, 
    data: hash, 
    isPending,
    error: writeError 
  } = useWriteContract();

  const { 
    isLoading: isWaiting, 
    isSuccess,
    error: txError 
  } = useWaitForTransactionReceipt({ 
    hash 
  });

  // Log des erreurs
  useEffect(() => {
    if (writeError) {
      console.error('Erreur writeContract:', writeError);
      alert(`Erreur Faucet: ${writeError.message}`);
    }
  }, [writeError]);

  useEffect(() => {
    if (txError) {
      console.error('Erreur transaction:', txError);
    }
  }, [txError]);

  const claimUSDC = async () => {
    if (!address) {
      alert('Connectez votre wallet d\'abord !');
      return;
    }

    try {
      console.log('Appel du faucet pour:', address);
      console.log('Contrat USDC:', usdc.address);
      
      writeContract({
        ...usdc,
        functionName: 'mint',
        args: [address, parseUnits('1000', 6)],
      });
    } catch (error) {
      console.error('Erreur lors de l\'appel mint:', error);
      alert(`Erreur: ${error}`);
    }
  };

  return {
    claimUSDC,
    isLoading: isPending || isWaiting,
    isSuccess,
    hash,
  };
}