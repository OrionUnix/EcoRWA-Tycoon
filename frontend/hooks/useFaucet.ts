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
      alert(`Erreur Faucet: ${writeError.message}`);
    }
  }, [writeError]);



  const claimUSDC = async () => {
    if (!address) {
      alert('Connectez votre wallet d\'abord !');
      return;
    }

    try {


      writeContract({
        ...usdc,
        functionName: 'mint',
        args: [address, parseUnits('1000', 6)],
      });
    } catch (error) {
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