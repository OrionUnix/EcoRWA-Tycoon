'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAccount } from 'wagmi';
import { Loader2, Coins, ExternalLink } from 'lucide-react';

// Import de tes hooks
import { useMintBuilding } from '@/hooks/useMintBuilding';
import { useBuildingInfo } from '@/hooks/useBuildingInfo';
import { useHolderStats } from '@/hooks/useHolderStats';
import { useFaucet } from '@/hooks/useFaucet';

interface BuildingPurchaseDialogProps {
  buildingId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BuildingPurchaseDialog({
  buildingId,
  isOpen,
  onClose,
}: BuildingPurchaseDialogProps) {
  const [amount, setAmount] = useState(1);
  const { address } = useAccount();

  // 1. On récupère les infos du bâtiment et les stats de l'utilisateur
  // On récupère "refetch" pour pouvoir mettre à jour l'UI sans recharger la page
  const { building, isLoading: isBuildingLoading, refetch: refreshBuilding } = useBuildingInfo(buildingId || 1);
  const { stats, refetch: refreshStats } = useHolderStats(buildingId || 1);
  
  // 2. Hook pour le Faucet
  const { claimUSDC, isLoading: isFaucetLoading } = useFaucet();

  // 3. Hook pour l'achat (Mint)
  // On passe une fonction de callback qui s'exécute quand la transaction est validée
  const { handleMint, isLoading: isMinting, allowance } = useMintBuilding(() => {
    refreshBuilding(); // Met à jour le stock disponible
    refreshStats();    // Met à jour l'investissement du joueur
  });

  // Reset de la quantité quand on change de bâtiment
  useEffect(() => {
    setAmount(1);
  }, [buildingId]);

  if (!buildingId || !building) return null;

  // Calculs financiers
  const totalCostRaw = BigInt(Math.floor(building.pricePerToken * amount * 1e6));
  const needsApproval = allowance < totalCostRaw;
  const canAfford = true; // On pourrait ajouter une vérification de balance ici

  const handleAction = async () => {
    try {
      await handleMint(buildingId, amount, building.pricePerToken);
    } catch (error) {
      console.error("Erreur lors de l'action:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {building.name}
            {stats && stats.balance > 0 && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/50">
                Déjà investi: {stats.balance} tokens
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            ID du bâtiment: #{buildingId} • Localisation: Paris, France
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          {/* Section Gauche: Visuel & Info */}
          <div className="space-y-4">
            <div className="relative h-48 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-700">
              <div 
                className="w-24 h-32 rounded-md animate-pulse"
                style={{ 
                  backgroundColor: building.color || '#8B5CF6',
                  boxShadow: `0 0 40px ${building.color || '#8B5CF6'}60` 
                }}
              />
              <Badge className="absolute top-2 right-2 bg-blue-600">Immobilier RWA</Badge>
            </div>

            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <p className="text-xs text-slate-400 uppercase font-bold mb-2">Performances</p>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-400">Rendement</p>
                  <p className="text-xl font-bold text-green-400">{building.yieldPercentage}% <span className="text-xs">/an</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Prix Unitaire</p>
                  <p className="text-xl font-bold">{building.pricePerToken} USDC</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Section Droite: Formulaire d'achat */}
          <div className="space-y-4">
            <Card className="p-4 bg-blue-950/20 border-blue-900/50">
              <p className="text-xs text-blue-400 font-bold mb-2 tracking-widest">DISPONIBILITÉ</p>
              <div className="flex justify-between text-sm mb-2">
                <span>Tokens vendus</span>
                <span>{building.mintedSupply} / {building.totalSupply}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-1000"
                  style={{ width: `${(building.mintedSupply / building.totalSupply) * 100}%` }}
                />
              </div>
            </Card>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold uppercase">Quantité à acquérir</label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-slate-700 bg-slate-800"
                  onClick={() => setAmount(Math.max(1, amount - 1))}
                >-</Button>
                <Input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="bg-slate-800 border-slate-700 text-center text-lg font-bold"
                />
                <Button 
                  variant="outline" 
                  className="border-slate-700 bg-slate-800"
                  onClick={() => setAmount(amount + 1)}
                >+</Button>
              </div>
            </div>

            <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total à payer</span>
                <span className="text-2xl font-black text-white">{(building.pricePerToken * amount).toFixed(2)} USDC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerte PLU IA */}
        <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg flex gap-3 items-start">
          <span className="text-xl">🤖</span>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            <span className="font-bold text-amber-400">Analyse IA :</span> {building.pluAlert}
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-4">
          {/* Bouton Faucet */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={claimUSDC}
            disabled={isFaucetLoading}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
          >
            {isFaucetLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Coins className="h-4 w-4 mr-2" />}
            Besoin de MockUSDC ?
          </Button>

          <div className="flex-1 flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Annuler
            </Button>
            
            <Button 
              onClick={handleAction}
              disabled={isMinting || !address}
              className={`flex-[2] font-bold text-white transition-all ${
                needsApproval 
                ? "bg-amber-600 hover:bg-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.4)]" 
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              }`}
            >
              {isMinting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transaction...</>
              ) : needsApproval ? (
                "1. Approuver USDC"
              ) : (
                "2. Confirmer l'Achat"
              )}
            </Button>
          </div>
        </DialogFooter>

        {!address && (
          <p className="text-center text-[10px] text-red-400 mt-2 uppercase tracking-tighter">
            Veuillez connecter votre wallet pour interagir avec la blockchain
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}