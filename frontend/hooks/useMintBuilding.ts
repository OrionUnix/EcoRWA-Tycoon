'use client';

import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { useVaultContract, useUSDCContract } from './useContract';
import { parseUnits } from 'viem';

export function useMintBuilding() {
  const { address } = useAccount();
  const vault = useVaultContract();
  const usdc = useUSDCContract();

  // Vérifier l'allowance USDC
  const { data: allowance } = useReadContract({
    ...usdc,
    functionName: 'allowance',
    args: [address!, vault.address],
    query: { enabled: !!address },
  });

  // Approve USDC
  const {
    writeContract: approveUSDC,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isApproveTxLoading } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Mint Building
  const {
    writeContract: mintBuilding,
    data: mintHash,
    isPending: isMinting,
  } = useWriteContract();

  const { isLoading: isMintTxLoading, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  const handleMint = async (buildingId: number, amount: number, pricePerToken: number) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const totalCost = parseUnits((pricePerToken * amount).toString(), 6);
    const currentAllowance = (allowance as bigint) || 0n;

    // Si allowance insuffisante, approve d'abord
    if (currentAllowance < totalCost) {
      approveUSDC({
        ...usdc,
        functionName: 'approve',
        args: [vault.address, totalCost],
      });
      return; // Attendre que l'approve soit confirmé
    }

    // Sinon, mint directement
    mintBuilding({
      ...vault,
      functionName: 'mintBuilding',
      args: [BigInt(buildingId), BigInt(amount)],
    });
  };

  return {
    handleMint,
    isApproving: isApproving || isApproveTxLoading,
    isMinting: isMinting || isMintTxLoading,
    isMintSuccess,
    needsApproval: (amount: number, pricePerToken: number) => {
      const totalCost = parseUnits((pricePerToken * amount).toString(), 6);
      const currentAllowance = (allowance as bigint) || 0n;
      return currentAllowance < totalCost;
    },
  };
}