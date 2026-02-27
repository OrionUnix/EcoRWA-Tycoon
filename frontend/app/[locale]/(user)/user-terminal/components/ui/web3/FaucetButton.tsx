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
        const lastClaim = localStorage.getItem('last_faucet_claim');
        if (lastClaim) {
            const elapsed = Date.now() - parseInt(lastClaim, 10);
            if (elapsed < COOLDOWN_DURATION) {
                setCooldownTime(parseInt(lastClaim, 10) + COOLDOWN_DURATION);
            }
        }
    }, []);

    useEffect(() => {
        if (!cooldownTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = cooldownTime - now;

            if (diff <= 0) {
                setCooldownTime(null);
                setTimeString("");
                localStorage.removeItem('last_faucet_claim');
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
            localStorage.setItem('last_faucet_claim', now.toString());
            localStorage.setItem('rwa_faucet_claimed', 'true');
            setCooldownTime(now + COOLDOWN_DURATION);

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
                className={`relative group transition-all ${isDisabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 active:translate-y-1'}`}
            >
                <img
                    src={withBasePath('/assets/isometric/Spritesheet/IU/bouttons/faucet.png')}
                    alt="Faucet"
                    className="w-32 h-auto pixelated shadow-[2px_2px_0_black]"
                />

                {(isLoading || cooldownTime) && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center border-2 border-black">
                        <span className="text-[10px] font-black uppercase text-yellow-400 text-center px-1">
                            {isLoading ? "En cours..." : `Attente : ${timeString}`}
                        </span>
                    </div>
                )}
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