'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, ShieldCheck, Wallet, AlertCircle 
} from 'lucide-react';

import ModelViewer from '@/components/3D/ModelViewer';
import { BUILDINGS_DATA } from '@/data/buildings';
import { fixPath } from '@/lib/pathUtils';
import { useMintBuilding } from '@/hooks/useMintBuilding';
import { useBuildingInfo } from '@/hooks/useBuildingInfo';
import { useFaucet } from '@/hooks/useFaucet';

const MODEL_CONFIGS: Record<string, { path: string; scale: number }> = {
  'Résidentiel': { path: '/assets/models/suburban/loft-saint-germain.glb', scale: 0.055 },
  'Commercial':  { path: '/assets/models/commercial/building-a.glb', scale: 0.7 },
  'Mixte':       { path: '/assets/models/suburban/building-type-o.glb', scale: 0.7 },
};

export default function BuildingPurchaseDialog({ 
  buildingId, 
  isOpen, 
  onClose 
}: { 
  buildingId: number | null, 
  isOpen: boolean, 
  onClose: () => void 
}) {
  if (!isOpen || buildingId === null) return null;

  const staticData = BUILDINGS_DATA.find(b => b.id === buildingId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-black/60 backdrop-blur-xl border-white/10 text-white p-0 overflow-hidden shadow-2xl ring-1 ring-white/20">
        <DialogHeader className="sr-only">
          <DialogTitle>{staticData?.name || "Asset Details"}</DialogTitle>
          <DialogDescription>RWA Investment Interface</DialogDescription>
        </DialogHeader>
        
        <PurchaseContent buildingId={buildingId} />
      </DialogContent>
    </Dialog>
  );
}

function PurchaseContent({ buildingId }: { buildingId: number }) {
  const t = useTranslations('PurchaseDialog');
  const tBuilding = useTranslations('building');
  const locale = useLocale() as 'en' | 'fr';
  
  const [amount, setAmount] = useState(1);
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  
  const { building: contractData, isLoading: isDataLoading } = useBuildingInfo(buildingId);
  const staticData = BUILDINGS_DATA.find(b => b.id === buildingId);
  const { handleMint, isLoading: isMinting, allowance } = useMintBuilding();
  const { claimUSDC, isLoading: isFaucetLoading } = useFaucet();

  const isWrongNetwork = isConnected && chainId !== avalancheFuji.id;
  const price = contractData?.pricePerToken || 0;
  const needsApproval = (Number(allowance) / 1e6) < (price * amount);

  const currentModel = staticData ? (MODEL_CONFIGS[staticData.type.fr] || MODEL_CONFIGS['Résidentiel']) : null;

  if (isDataLoading || !staticData || !contractData) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] w-full gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#E84142]" />
        <p className="text-sm font-bold animate-pulse text-white/50 tracking-widest uppercase">
            {t('loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 h-full min-h-[550px]">
      
      {/* GAUCHE : VISUEL 3D */}
      <div className="md:col-span-2 relative bg-gradient-to-b from-black/40 to-transparent flex flex-col items-center justify-center border-r border-white/5 p-6">
        <Badge className="absolute top-6 left-6 bg-[#E84142] text-[8px] font-black italic px-3 py-1 uppercase tracking-widest rounded-full shadow-lg">
          {tBuilding(`type.${staticData.type.fr.toLowerCase()}`)}
        </Badge>
        
        <div className="w-full h-[480px]">
          {currentModel && (
            <ModelViewer url={fixPath(currentModel.path)} scale={currentModel.scale} />
          )}
        </div>
      </div>

      {/* DROITE : INFOS & ACTIONS */}
      <div className="md:col-span-3 p-10 bg-white/5 backdrop-blur-md space-y-5 flex flex-col justify-between relative">
        
        <div className="absolute top-6 right-8 flex items-center gap-2 px-3 py-1.5 border border-[#E84142]/40 bg-[#E84142]/10 rounded-full">
          <div className="w-2 h-2 bg-[#E84142] rounded-full animate-pulse" />
          <span className="text-[8px] font-black uppercase text-white/90">{t('fujiWarning')}</span>
        </div>

        <header>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-1">{staticData.name}</h2>
          <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3 text-[#E84142]" />
            {t('verifiedAsset')} #00{buildingId}
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-[9px] text-white/40 font-bold uppercase mb-1 tracking-wider">{t('yield')}</p>
            <p className="text-2xl font-black text-emerald-400">{contractData.yieldPercentage}% <span className="text-xs opacity-50">APY</span></p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <p className="text-[9px] text-white/40 font-bold uppercase mb-1 tracking-wider">{t('riskScore')}</p>
            <p className={`text-xl font-black uppercase ${staticData.aiReport.riskLevel === 'LOW' ? 'text-blue-400' : 'text-orange-400'}`}>
              {tBuilding(`risk.${staticData.aiReport.riskLevel.toLowerCase()}`)}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-white/10 to-transparent border border-white/10 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/40 font-bold uppercase mb-1">{t('price')}</p>
            <p className="text-xl font-black">{contractData.pricePerToken} <span className="text-xs text-white/40">USDC</span></p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-[#E84142] font-bold uppercase mb-1">{t('total')}</p>
            <p className="text-lg font-black font-mono">{(price * amount).toLocaleString()} USDC</p>
          </div>
        </div>

        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-white/50">{tBuilding('quantity')}</span>
            <div className="flex items-center gap-4 bg-white/5 rounded-xl px-3 py-1 border border-white/10">
              <button onClick={() => setAmount(Math.max(1, amount - 1))} className="hover:text-[#E84142] font-bold">-</button>
              <span className="font-black w-6 text-center">{amount}</span>
              <button onClick={() => setAmount(amount + 1)} className="hover:text-[#E84142] font-bold">+</button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[8px] font-black uppercase text-white/30">
              <span>{t('availability')}</span>
              <span>{((contractData.mintedSupply / contractData.totalSupply) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#E84142]" 
                style={{ width: `${(contractData.mintedSupply / contractData.totalSupply) * 100}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {!isConnected ? (
            <Button onClick={openConnectModal} className="w-full h-11 bg-white/10 border border-white/30 font-black uppercase text-xs">
              <Wallet className="mr-2 h-4 w-4" /> {t('connectWallet')}
            </Button>
          ) : isWrongNetwork ? (
            <Button onClick={() => switchChain?.({ chainId: avalancheFuji.id })} className="w-full h-12 bg-orange-600 font-black uppercase">
              <AlertCircle className="mr-2 h-4 w-4" /> {t('wrongNetwork')}
            </Button>
          ) : (
            <Button 
              onClick={() => handleMint(buildingId, amount, price)}
              disabled={isMinting}
              className={`w-full h-12 font-black uppercase transition-all ${
                needsApproval ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-white text-black hover:bg-[#E84142] hover:text-white"
              }`}
            >
              {isMinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isMinting ? t('processing') : needsApproval ? t('approve') : t('confirm')}
            </Button>
          )}
          
          {isConnected && (
            <button 
              onClick={claimUSDC} 
              disabled={isFaucetLoading}
              className="w-full text-[9px] text-white/20 hover:text-[#E84142] font-bold uppercase tracking-widest transition-colors"
            >
              {isFaucetLoading ? "TX IN PROGRESS..." : t('faucet')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}