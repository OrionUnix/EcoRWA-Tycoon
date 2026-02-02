'use client';

import { useReadContract, useAccount } from 'wagmi';
import { useVaultContract, useUSDCContract } from './useContract';
import { useMemo } from 'react';

export function useVaultData() {
    const { address, isConnected } = useAccount();
    const vault = useVaultContract();
    const usdc = useUSDCContract();

    // Read USDC Balance
    const { data: usdcBalance } = useReadContract({
        ...usdc,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && isConnected,
        },
    });

    // Read Total Yield Claimed (placeholder - needs actual contract function)
    const { data: totalYieldClaimed } = useReadContract({
        ...vault,
        functionName: 'getUserTotalClaimed',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && isConnected,
        },
    });

    // Read Pending Yield (placeholder - needs actual contract function)
    const { data: pendingYield } = useReadContract({
        ...vault,
        functionName: 'getUserPendingYield',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && isConnected,
        },
    });

    // Read User Buildings (placeholder - needs to iterate through building IDs)
    // For now, we'll return empty array until we implement proper enumeration
    const ownedBuildings = useMemo(() => {
        // TODO: Implement proper building enumeration
        // This would require either:
        // 1. Iterating through all building IDs and checking balanceOf
        // 2. Listening to Transfer events
        // 3. Having a contract function that returns user's buildings
        return [];
    }, [address]);

    return {
        usdcBalance: usdcBalance ? Number(usdcBalance) / 1e6 : 0,
        totalYieldClaimed: totalYieldClaimed ? Number(totalYieldClaimed) / 1e6 : 0,
        pendingYield: pendingYield ? Number(pendingYield) / 1e6 : 0,
        ownedBuildings,
        isLoading: !isConnected,
    };
}
