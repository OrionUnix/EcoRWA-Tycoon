// hooks/useDashboardData.ts
import { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { useBuildingInfo } from '@/hooks/useBuildingInfo';
import { useHolderStats } from '@/hooks/useHolderStats';
import { useUSDCContract } from '@/hooks/useContract';

export interface BuildingData {
  id: number;
  name?: string;
  partPrice?: number;
  annualYield?: number;
  totalParts?: number;
  mintedParts?: number;
  isActive?: boolean;
  isLoading: boolean;
  stats?: {
    balance: number;
    investedAmount: number;
    pendingYield: number;
    annualYield: number;
  };
}

export interface DashboardData {
  buildings: BuildingData[];
  totals: {
    invested: number;
    parts: number;
    pending: number;
    annual: number;
    avgYield: number;
  };
  usdcBalance: string;
  address?: string;
  isLoading: boolean;
}

export function useDashboardData(): DashboardData {
  const { address } = useAccount();
  const usdc = useUSDCContract();

  // Fetch building data
  const { building: b1Info, isLoading: b1Loading } = useBuildingInfo(1);
  const { stats: b1Stats } = useHolderStats(1);
  
  const { building: b2Info, isLoading: b2Loading } = useBuildingInfo(2);
  const { stats: b2Stats } = useHolderStats(2);
  
  const { building: b3Info, isLoading: b3Loading } = useBuildingInfo(3);
  const { stats: b3Stats } = useHolderStats(3);

  // DEBUG: Log pour voir ce qui est récupéré
  console.log('🏢 Building 1:', { info: b1Info, stats: b1Stats });
  console.log('🏢 Building 2:', { info: b2Info, stats: b2Stats });
  console.log('🏢 Building 3:', { info: b3Info, stats: b3Stats });

  // Fetch USDC balance
  const { data: usdcBal, isLoading: isLoadingUsdc } = useReadContract({
    ...usdc,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  });

  // Combine building data
  const buildings: BuildingData[] = useMemo(() => {
    return [
      {
        id: 1,
        name: b1Info?.name,
        partPrice: b1Info?.pricePerToken,
        annualYield: b1Info?.yieldPercentage,
        totalParts: b1Info?.totalSupply,
        mintedParts: b1Info?.mintedSupply,
        isActive: b1Info?.isActive,
        isLoading: b1Loading,
        stats: b1Stats || undefined,
      },
      {
        id: 2,
        name: b2Info?.name,
        partPrice: b2Info?.pricePerToken,
        annualYield: b2Info?.yieldPercentage,
        totalParts: b2Info?.totalSupply,
        mintedParts: b2Info?.mintedSupply,
        isActive: b2Info?.isActive,
        isLoading: b2Loading,
        stats: b2Stats || undefined,
      },
      {
        id: 3,
        name: b3Info?.name,
        partPrice: b3Info?.pricePerToken,
        annualYield: b3Info?.yieldPercentage,
        totalParts: b3Info?.totalSupply,
        mintedParts: b3Info?.mintedSupply,
        isActive: b3Info?.isActive,
        isLoading: b3Loading,
        stats: b3Stats || undefined,
      },
    ];
  }, [b1Info, b1Stats, b1Loading, b2Info, b2Stats, b2Loading, b3Info, b3Stats, b3Loading]);

  // Calculate totals
  const totals = useMemo(() => {
    const invested = buildings.reduce((acc, b) => acc + (b.stats?.investedAmount || 0), 0);
    const parts = buildings.reduce((acc, b) => acc + (b.stats?.balance || 0), 0);
    const pending = buildings.reduce((acc, b) => acc + (b.stats?.pendingYield || 0), 0);
    const annual = buildings.reduce((acc, b) => acc + (b.stats?.annualYield || 0), 0);
    const avgYield = invested > 0 ? (annual / invested) * 100 : 0;

    console.log('📊 Totals:', { invested, parts, pending, annual, avgYield });

    return { invested, parts, pending, annual, avgYield };
  }, [buildings]);

  const isLoading = b1Loading || b2Loading || b3Loading || isLoadingUsdc;

  return {
    buildings,
    totals,
    usdcBalance: usdcBal ? parseFloat(formatUnits(usdcBal as bigint, 6)).toFixed(2) : '0.00',
    address,
    isLoading
  };
}