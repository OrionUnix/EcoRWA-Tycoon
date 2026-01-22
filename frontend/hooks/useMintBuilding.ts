'use client';

import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { useVaultContract, useUSDCContract } from './useContract';
import { parseUnits } from 'viem';
import { useEffect } from 'react';

export function useMintBuilding(onSuccess?: () => void) {
  const { address } = useAccount();
  const vault = useVaultContract();
  const usdc = useUSDCContract();

  // 1. Lecture de l'allowance avec "refetch" manuel possible
  const { data: allowance, refetch: refreshAllowance } = useReadContract({
    ...usdc,
    functionName: 'allowance',
    args: [address!, vault.address],
    query: { enabled: !!address },
  });

  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 2. Gestion automatique du rafraîchissement après succès
  useEffect(() => {
    if (isSuccess) {
      refreshAllowance(); // Met à jour l'allowance dans le cache
      onSuccess?.();      // Déclenche le rafraîchissement des stats dans l'UI
    }
  }, [isSuccess, refreshAllowance, onSuccess]);

  const handleMint = async (buildingId: number, amount: number, pricePerToken: number) => {
    if (!address) return;

    const totalCost = parseUnits((pricePerToken * amount).toString(), 6);
    const currentAllowance = (allowance as bigint) || 0n;

    if (currentAllowance < totalCost) {
      // ÉTAPE A : APPROVE (Si nécessaire)
      writeContract({
        ...usdc,
        functionName: 'approve',
        args: [vault.address, totalCost * 10n], // On approuve 10x plus pour éviter de redemander
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
    allowance: (allowance as bigint) || 0n,
  };
}