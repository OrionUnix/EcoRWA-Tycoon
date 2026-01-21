import { useReadContract } from 'wagmi';

// 👇 REMPLACE PAR L'ADRESSE DE TON CONTRAT DÉPLOYÉ
const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS_HERE"; 

const ABI = [
  {
    inputs: [{ internalType: "uint256", name: "buildingId", type: "uint256" }],
    name: "getBuildingInfo",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "pricePerToken", type: "uint256" },
      { internalType: "uint256", name: "yieldPercentage", type: "uint256" },
      { internalType: "uint256", name: "totalSupply", type: "uint256" },
      { internalType: "uint256", name: "mintedSupply", type: "uint256" },
      { internalType: "string", name: "pluAlert", type: "string" },
      { internalType: "bool", name: "isActive", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

export function useBuildingInfo(buildingId: number) {
  const { data, isError, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ABI,
    functionName: 'getBuildingInfo',
    args: [BigInt(buildingId)],
  });

  // On formate les données brutes (tableau) en objet facile à utiliser
  // Le retour de Solidity est un tableau : [name, price, yield, total, minted, alert, active]
  const formattedBuilding = data ? {
    name: data[0],
    pricePerToken: data[1],
    yieldPercentage: data[2],
    totalSupply: data[3],
    mintedSupply: data[4],
    pluAlert: data[5],
    isActive: data[6]
  } : null;

  return {
    building: formattedBuilding,
    isLoading,
    isError
  };
}