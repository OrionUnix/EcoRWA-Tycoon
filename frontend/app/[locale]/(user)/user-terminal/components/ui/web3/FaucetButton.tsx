import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseAbi } from 'viem';
import { getGameEngine } from '../../../engine/GameEngine';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const MOCK_USDC_ABI = parseAbi([
    'function mint(address to, uint256 amount) external'
]);

interface FaucetButtonProps {
    onStart: () => void;
    onSuccess: () => void;
    onError: (error: any) => void;
    // 🔥 CHANGEMENT ICI : Le point d'interrogation rend la prop optionnelle
    buttonText?: string;
    className?: string;
}

export const FaucetButton: React.FC<FaucetButtonProps> = ({
    onStart,
    onSuccess,
    onError,
    // Si pas de texte fourni, ça vaut undefined
    buttonText,
    className = ""
}) => {
    // ... (TOUT LE RESTE DU CODE JS NE CHANGE PAS : useAccount, useEffects, handleClaim...)
    const { address, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const engine = getGameEngine();

    const [isLoading, setIsLoading] = useState(false);
    const [cooldownTime, setCooldownTime] = useState<number | null>(null);
    const [timeString, setTimeString] = useState("");

    const COOLDOWN_DURATION = 48 * 60 * 60 * 1000; // 48 heures

    useEffect(() => {
        const lastClaim = engine.map.flags.lastFaucetClaim;
        if (lastClaim > 0) {
            const elapsed = Date.now() - lastClaim;
            if (elapsed < COOLDOWN_DURATION) {
                setCooldownTime(lastClaim + COOLDOWN_DURATION);
            }
        }
    }, [engine.map.flags.lastFaucetClaim]);

    useEffect(() => {
        if (!cooldownTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = cooldownTime - now;

            if (diff <= 0) {
                setCooldownTime(null);
                setTimeString("");
                engine.map.flags.lastFaucetClaim = 0;
                clearInterval(interval);
            } else {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeString(`${h}h ${m}m`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [cooldownTime]);

    const handleClaim = async () => {
        if (!isConnected || !address) return alert('Veuillez connecter votre portefeuille Web3.');
        if (cooldownTime) return;

        setIsLoading(true);
        onStart();

        try {
            const mintAmount = BigInt(10000 * 1e6);
            await writeContractAsync({
                address: USDC_ADDRESS,
                abi: MOCK_USDC_ABI,
                functionName: 'mint',
                args: [address, mintAmount],
            });

            const now = Date.now();
            engine.map.flags.lastFaucetClaim = now;
            setCooldownTime(now + COOLDOWN_DURATION);

            // Sync legacy localStorage for safety
            localStorage.setItem('last_faucet_claim', now.toString());
            localStorage.setItem('rwa_faucet_claimed', 'true');

            engine.map.resources.money += 10000;
            onSuccess();
        } catch (error) {
            onError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const isDisabled = !!cooldownTime || isLoading;

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <button
                onClick={handleClaim}
                disabled={isDisabled}
                className={`relative group px-6 py-2 border-2 border-black text-xs font-black uppercase tracking-widest transition-none rounded-none text-white ${isDisabled
                    ? 'bg-slate-400 translate-y-[2px] translate-x-[2px] shadow-none cursor-not-allowed'
                    : 'bg-emerald-500 shadow-[4px_4px_0_0_#000] hover:bg-emerald-600 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none'
                    }`}
            >
                {isLoading ? "Minting..." : (cooldownTime ? timeString : "FAUCET")}
            </button>

            {/* 🔥 CHANGEMENT ICI : On affiche le span SEULEMENT si buttonText existe */}
            {buttonText && !isDisabled && (
                <span className="mt-2 text-xs font-black text-emerald-400 uppercase tracking-widest drop-shadow-md bg-black/50 px-2 py-1 rounded">
                    {buttonText}
                </span>
            )}
        </div>
    );
};