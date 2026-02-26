import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';

// ─── CONTRATS (Avalanche Fuji Testnet) ───────────────────────────────────────
const USDC_ADDRESS = '0x91d5F6B2458ea9f060EDAD50794cc79E7Ec30cE0' as const;
const VAULT_ADDRESS = '0x3eb8fe6dB6F6cbD4038ddAB73E05D57C8c70C11A' as const;

// USDC decimals — ajuste à 18 si ton MockUSDC utilise 18 (vérifie avec decimals())
const USDC_DECIMALS = 6;

// ─── ABIs MINIMALES ───────────────────────────────────────────────────────────
const erc20Abi = [
    {
        name: 'approve',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

const vaultAbi = [
    {
        name: 'buyShares',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'buildingId', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
    },
] as const;

// ─── ÉTATS ────────────────────────────────────────────────────────────────────
export type InvestStatus =
    | 'IDLE'
    | 'APPROVING'
    | 'WAITING_APPROVE_TX'
    | 'BUYING'
    | 'WAITING_BUY_TX'
    | 'SUCCESS'
    | 'ERROR';

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export const useInvestRWA = () => {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient(); // ✅ Vrai attente on-chain

    const [status, setStatus] = useState<InvestStatus>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [buyTxHash, setBuyTxHash] = useState<`0x${string}` | null>(null);

    const executeInvestment = async (buildingId: number, priceUSDC: number) => {
        if (!address) { setErrorMessage('Wallet non connecté'); return; }
        if (!publicClient) { setErrorMessage('Client RPC introuvable'); return; }

        try {
            setStatus('APPROVING');
            setErrorMessage(null);
            setBuyTxHash(null);

            const amount = parseUnits(priceUSDC.toString(), USDC_DECIMALS);

            // ── ÉTAPE 1 : approve(vaultAddress, amount) ────────────────────
            const approveTxHash = await writeContractAsync({
                address: USDC_ADDRESS,
                abi: erc20Abi,
                functionName: 'approve',
                args: [VAULT_ADDRESS, amount],
            });

            // ✅ On attend la confirmation RÉELLE (pas un setTimeout)
            setStatus('WAITING_APPROVE_TX');
            await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

            // ── ÉTAPE 2 : buyShares(buildingId, amount) ────────────────────
            setStatus('BUYING');
            const purchaseTxHash = await writeContractAsync({
                address: VAULT_ADDRESS,
                abi: vaultAbi,
                functionName: 'buyShares',
                args: [BigInt(buildingId), amount],
            });

            setStatus('WAITING_BUY_TX');
            await publicClient.waitForTransactionReceipt({ hash: purchaseTxHash });

            setBuyTxHash(purchaseTxHash);
            setStatus('SUCCESS');
            console.log('✅ Investissement réussi ! Tx:', purchaseTxHash);

        } catch (error: any) {
            console.error('❌ Investissement échoué:', error);
            setStatus('ERROR');
            // Wagmi/Viem expose shortMessage pour l'UX (ex: "User rejected the request")
            setErrorMessage(error.shortMessage ?? error.message ?? 'Transaction échouée');
        }
    };

    const resetStatus = () => {
        setStatus('IDLE');
        setErrorMessage(null);
        setBuyTxHash(null);
    };

    return {
        executeInvestment,
        status,
        errorMessage,
        buyTxHash,  // Pour afficher le lien Snowtrace dans l'UI après succès
        resetStatus,
        isLoading: status !== 'IDLE' && status !== 'SUCCESS' && status !== 'ERROR',
    };
};
