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
import { useMintBuilding } from '@/hooks/useMintBuilding';
import { useBuildingInfo } from '@/hooks/useBuildingInfo';
import { useAccount } from 'wagmi';
import { Loader2 } from 'lucide-react';

interface BuildingPurchaseDialogProps {
  buildingId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BuildingPurchaseDialog({
  buildingId,
  isOpen,
  onClose,
  onSuccess,
}: BuildingPurchaseDialogProps) {
  const [amount, setAmount] = useState(1);
  const { address } = useAccount();
  const { building, isLoading: isBuildingLoading } = useBuildingInfo(buildingId || 1);
  const { handleMint, isApproving, isMinting, isMintSuccess, needsApproval } = useMintBuilding();

  useEffect(() => {
    if (isMintSuccess) {
      onSuccess?.();
      onClose();
    }
  }, [isMintSuccess, onSuccess, onClose]);

  if (!buildingId || !building) return null;

  const totalCost = building.pricePerToken * amount;
  const needApproval = needsApproval(amount, building.pricePerToken);

  const handlePurchase = () => {
    handleMint(buildingId, amount, building.pricePerToken);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">
            {building.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Investissez dans cet actif immobilier tokenisé
          </DialogDescription>
        </DialogHeader>

        {/* Photo 3D du bâtiment */}
        <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-32 h-32 rounded-lg"
              style={{ 
                backgroundColor: buildingId === 1 ? '#8B5CF6' : buildingId === 2 ? '#F59E0B' : '#10B981',
                boxShadow: `0 0 60px ${buildingId === 1 ? '#8B5CF6' : buildingId === 2 ? '#F59E0B' : '#10B981'}80`,
              }}
            />
          </div>
          {building.isActive && (
            <Badge className="absolute top-4 right-4 bg-red-500">
              🏷️ À VENDRE
            </Badge>
          )}
        </div>

        {/* Informations */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Prix par token</p>
            <p className="text-2xl font-bold text-white">{building.pricePerToken} USDC</p>
          </Card>
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Rendement annuel</p>
            <p className="text-2xl font-bold text-green-400">{building.yieldPercentage}%</p>
          </Card>
        </div>

        {/* Supply info */}
        <Card className="p-4 bg-slate-800/50 border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Tokens disponibles</span>
            <span className="text-sm font-semibold text-white">
              {building.totalSupply - building.mintedSupply} / {building.totalSupply}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(building.mintedSupply / building.totalSupply) * 100}%` }}
            />
          </div>
        </Card>

        {/* Alerte PLU */}
        <Card className="p-4 bg-blue-950/30 border-blue-900">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-sm font-semibold text-blue-400 mb-1">
                Analyse IA - Alerte PLU
              </p>
              <p className="text-sm text-slate-300">{building.pluAlert}</p>
            </div>
          </div>
        </Card>

        {/* Sélection quantité */}
        <div className="space-y-3">
          <label className="text-sm text-slate-300">
            Nombre de tokens à acheter
          </label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount(Math.max(1, amount - 1))}
              className="bg-slate-800 border-slate-700"
              disabled={isApproving || isMinting}
            >
              -
            </Button>
            <Input
              type="number"
              min="1"
              max={building.totalSupply - building.mintedSupply}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Math.min(building.totalSupply - building.mintedSupply, parseInt(e.target.value) || 1)))}
              className="text-center bg-slate-800 border-slate-700 text-white"
              disabled={isApproving || isMinting}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount(Math.min(building.totalSupply - building.mintedSupply, amount + 1))}
              className="bg-slate-800 border-slate-700"
              disabled={isApproving || isMinting}
            >
              +
            </Button>
          </div>

          {/* Coût total */}
          <Card className="p-4 bg-slate-800 border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Coût total</span>
              <span className="text-2xl font-bold text-white">
                {totalCost.toFixed(2)} USDC
              </span>
            </div>
          </Card>
        </div>

        <DialogFooter className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            disabled={isApproving || isMinting}
          >
            Annuler
          </Button>
          <Button
            onClick={handlePurchase}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={!address || isApproving || isMinting || !building.isActive}
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approbation USDC...
              </>
            ) : isMinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Achat en cours...
              </>
            ) : needApproval ? (
              <>✅ Approuver USDC</>
            ) : (
              <>💳 Acheter {amount} token{amount > 1 ? 's' : ''}</>
            )}
          </Button>
        </DialogFooter>

        {!address && (
          <p className="text-center text-sm text-yellow-500">
            ⚠️ Connectez votre wallet pour acheter
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}