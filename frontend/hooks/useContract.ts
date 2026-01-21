import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import VaultABI from '@/lib/abis/ParseCityVault.json';
import ERC20ABI from '@/lib/abis/IERC20.json';

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;

export function useVaultContract() {
  return {
    address: VAULT_ADDRESS,
    abi: VaultABI,
  };
}

export function useUSDCContract() {
  return {
    address: USDC_ADDRESS,
    abi: ERC20ABI,
  };
}