'use client';

import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { useVaultContract, useUSDCContract } from './useContract';
import { parseUnits } from 'viem';
import { useEffect } from 'react';

export function useMintBuilding(onSuccess?: () => void) {
  const { address, isConnected } = useAccount();
  const vault = useVaultContract();
  const usdc = useUSDCContract();

  // 1. Lecture de l'allowance sécurisée
  const { data: allowance, refetch: refreshAllowance } = useReadContract({
    ...usdc,
    functionName: 'allowance',
    args: address && vault.address ? [address, vault.address] : undefined,
    query: { 
      // On n'active la lecture que si l'utilisateur est vraiment connecté
      enabled: !!address && isConnected 
    },
  });

  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 2. Gestion automatique du rafraîchissement après succès
  useEffect(() => {
    if (isSuccess) {
      refreshAllowance();
      onSuccess?.();
    }
  }, [isSuccess, refreshAllowance, onSuccess]);

  const handleMint = async (buildingId: number, amount: number, pricePerToken: number) => {
    if (!address || !buildingId) return;

    // On s'assure d'avoir un chiffre rond pour parseUnits
    const totalCost = parseUnits((pricePerToken * amount).toFixed(6), 6);
    const currentAllowance = (allowance as bigint) || BigInt(0);

    if (currentAllowance < totalCost) {
      // ÉTAPE A : APPROVE
      writeContract({
        ...usdc,
        functionName: 'approve',
        args: [vault.address, totalCost * BigInt(100)], // On approuve large pour être tranquille
      });
    } else {
      // ÉTAPE B : MINT DIRECT
      writeContract({
        ...vault,
        functionName: 'mintBuilding',
        args: [BigInt(buildingId), BigInt(amount)],
      });
    }
  };

  return {
    handleMint,
    isLoading: isWritePending || isTxLoading,
    isSuccess,
    error: writeError,
    allowance: (allowance as bigint) || BigInt(0),
  };
}