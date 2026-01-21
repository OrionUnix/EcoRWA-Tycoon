'use client';

import { useReadContract, useAccount } from 'wagmi';
import { useVaultContract } from './useContract';

export function useHolderStats(buildingId: number) {
  const { address } = useAccount();
  const contract = useVaultContract();

  const { data, isLoading, error, refetch } = useReadContract({
    ...contract,
    functionName: 'getHolderStats',
    args: [BigInt(buildingId), address!],
    query: {
      enabled: !!address,
    },
  });

  if (!data || !address) {
    return { stats: null, isLoading, error, refetch };
  }

  const [balance, investedAmount, pendingYield, annualYield] = data as any[];

  return {
    stats: {
      balance: Number(balance),
      investedAmount: Number(investedAmount) / 1e6,
      pendingYield: Number(pendingYield) / 1e6,
      annualYield: Number(annualYield) / 1e6,
    },
    isLoading,
    error,
    refetch,
  };
}