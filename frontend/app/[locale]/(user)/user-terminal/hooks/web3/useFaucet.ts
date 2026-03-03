'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useBalance } from 'wagmi';
import { parseAbi, parseEther } from 'viem';
import { avalancheFuji } from 'wagmi/chains';
import { getGameEngine } from '../../engine/GameEngine';

// ─── Constants ────────────────────────────────────────────────────────────────

const FAUCET_ADDRESS = (process.env.NEXT_PUBLIC_FAUCET_ADDRESS || '0x0') as `0x${string}`;

const FAUCET_ABI = parseAbi([
    'function canClaim(address user) external view returns (bool eligible, uint256 remainingSec, uint256 nextAmount)',
    'function claim() external',
    'function claimCount(address) external view returns (uint256)',
]);

/// Garde-fou : Si le joueur a moins de MIN_AVAX, on bloque le claim
const MIN_AVAX_FOR_GAS = parseEther('0.02');

/// URL Faucet officiel Avalanche pour obtenir des AVAX
export const AVAX_FAUCET_URL = 'https://build.avax.network/console/primary-network/faucet';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FaucetState {
    eligible: boolean;
    displayTime: string;             // Countdown HH:MM:SS
    nextAmount: number;              // Montant en USDC (humain, ex: 1000)
    isLowAvax: boolean;              // AVAX insuffisant pour le gas
    isLoading: boolean;
    claimCount: number;
    handleClaim: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSeconds(secs: number): string {
    if (secs <= 0) return 'READY';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFaucet(): FaucetState {
    const { address, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const engine = getGameEngine();

    const [isLoading, setIsLoading] = useState(false);
    // Countdown local (descend chaque seconde, re-seedé depuis la chain)
    const [localSeconds, setLocalSeconds] = useState<number | null>(null);

    // ─── 1. On-chain query (60s refetch) ──────────────────────────────────────

    const { data: claimStatus } = useReadContract({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'canClaim',
        args: address ? [address] : undefined,
        query: {
            enabled: isConnected && !!address && FAUCET_ADDRESS !== '0x0',
            refetchInterval: 60_000, // 60 secondes
        },
    });

    const { data: countData } = useReadContract({
        address: FAUCET_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'claimCount',
        args: address ? [address] : undefined,
        query: {
            enabled: isConnected && !!address && FAUCET_ADDRESS !== '0x0',
        },
    });

    // ─── 2. AVAX native balance check ─────────────────────────────────────────

    const { data: avaxBalance } = useBalance({
        address,
        chainId: avalancheFuji.id,
        query: { enabled: isConnected && !!address, refetchInterval: 30_000 },
    });

    const isLowAvax = isConnected
        ? (avaxBalance ? avaxBalance.value < MIN_AVAX_FOR_GAS : false)
        : false;

    // ─── 3. Seed the local countdown from chain data ───────────────────────────

    useEffect(() => {
        if (!claimStatus) return;

        const [eligible, remainingSec] = claimStatus as [boolean, bigint, bigint];

        if (eligible) {
            setLocalSeconds(0);
        } else {
            // Re-seed le countdown avec la valeur fraîche de la blockchain
            setLocalSeconds(Number(remainingSec));
        }
    }, [claimStatus]);

    // ─── 4. Smooth tick every second ──────────────────────────────────────────

    useEffect(() => {
        if (localSeconds === null || localSeconds <= 0) return;

        const interval = setInterval(() => {
            setLocalSeconds(prev => {
                if (prev === null) return null;
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [localSeconds]);

    // ─── 5. Claim handler ─────────────────────────────────────────────────────

    const handleClaim = useCallback(async () => {
        if (!isConnected || !address) return;
        if (localSeconds !== 0 && localSeconds !== null) return;
        if (isLowAvax) return;
        if (FAUCET_ADDRESS === '0x0') return;

        setIsLoading(true);
        try {
            await writeContractAsync({
                address: FAUCET_ADDRESS,
                abi: FAUCET_ABI,
                functionName: 'claim',
            });

            // Update local game state with a symbolic bonus (réel = USDC sur chain)
            const nextAmountHuman = claimStatus
                ? Number((claimStatus as [boolean, bigint, bigint])[2]) / 1e6
                : 1000;
            engine.map.resources.money += nextAmountHuman;

            // Relancer le countdown local (72h)
            setLocalSeconds(72 * 3600);
        } catch (err) {
            console.error('[useFaucet] Claim error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [address, isConnected, isLowAvax, localSeconds, claimStatus, writeContractAsync, engine]);

    // ─── 6. Derived state ─────────────────────────────────────────────────────

    const eligible = localSeconds !== null && localSeconds <= 0;

    const nextAmount = claimStatus
        ? Math.round(Number((claimStatus as [boolean, bigint, bigint])[2]) / 1e6)
        : 1000;

    const displayTime = localSeconds === null
        ? '...'
        : formatSeconds(localSeconds);

    const claimCount = countData !== undefined ? Number(countData) : 0;

    return {
        eligible,
        displayTime,
        nextAmount,
        isLowAvax,
        isLoading,
        claimCount,
        handleClaim,
    };
}
