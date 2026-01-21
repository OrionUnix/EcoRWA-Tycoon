'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useVaultContract } from './useContract';

export function useClaimYield() {
  const vault = useVaultContract();

  const {
    writeContract: claimYield,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleClaim = (buildingId: number) => {
    claimYield({
      ...vault,
      functionName: 'claimYield',
      args: [BigInt(buildingId)],
    });
  };

  return {
    handleClaim,
    isClaiming: isPending || isTxLoading,
    isSuccess,
    error,
  };
}