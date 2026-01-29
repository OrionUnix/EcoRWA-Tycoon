'use client';

import { useReadContract } from 'wagmi';
import { useVaultContract } from './useContract';

export function useBuildingInfo(buildingId: number | null) {
  const contract = useVaultContract();

  const { data, isLoading, error, refetch } = useReadContract({
    ...contract,
    functionName: 'getBuildingInfo',
    args: buildingId ? [BigInt(buildingId)] : undefined,
    query: { 
      
      enabled: !!buildingId && buildingId > 0,
      refetchInterval: 30000, 
    },
  });

  if (!data || !buildingId) {
    return { building: null, isLoading, error, refetch };
  }

  const [name, pricePerToken, yieldPercentage, totalSupply, mintedSupply, pluAlert, isActive] = data as any[];

  return {
    building: {
      id: buildingId,
      name,
      pricePerToken: Number(pricePerToken) / 1e6, // USDC decimals
      yieldPercentage: Number(yieldPercentage) / 100, // basis points to %
      totalSupply: Number(totalSupply),
      mintedSupply: Number(mintedSupply),
      pluAlert,
      isActive,
    },
    isLoading,
    error,
    refetch,
  };
}