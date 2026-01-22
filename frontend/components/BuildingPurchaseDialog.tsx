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
import { Loader2, Coins, TrendingUp, AlertTriangle } from 'lucide-react';

// Import des données statiques
import { BUILDINGS_DATA } from '@/data/buildings';

// Hook pour la langue
function useLocale() {
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');
  
  useEffect(() => {
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'fr';
    setLocale(savedLocale as 'fr' | 'en');
  }, []);
  
  return locale;
}

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
  const language = useLocale(); // Utilise le hook de locale
  const { address } = useAccount();

  // 1. Données du smart contract
  const { building: contractData, isLoading: isBuildingLoading, refetch: refreshBuilding } = useBuildingInfo(buildingId || 1);
  const { stats, refetch: refreshStats } = useHolderStats(buildingId || 1);
  
  // 2. Données statiques du fichier
  const staticData = BUILDINGS_DATA.find(b => b.id === buildingId);
  
  // 3. Hook pour le Faucet
  const { claimUSDC, isLoading: isFaucetLoading } = useFaucet();

  // 4. Hook pour l'achat (Mint)
  const { handleMint, isLoading: isMinting, allowance } = useMintBuilding(() => {
    refreshBuilding();
    refreshStats();
  });

  // Reset de la quantité quand on change de bâtiment
  useEffect(() => {
    setAmount(1);
  }, [buildingId]);

  if (!buildingId || !contractData || !staticData) return null;

  // Calculs financiers
  const totalCostRaw = BigInt(Math.floor(contractData.pricePerToken * amount * 1e6));
  const needsApproval = allowance < totalCostRaw;

  const handleAction = async () => {
    try {
      await handleMint(buildingId, amount, contractData.pricePerToken);
    } catch (error) {
      console.error("Erreur lors de l'action:", error);
    }
  };

  // Couleur du badge de risque
  const riskColors = {
    LOW: 'bg-green-500/20 text-green-400 border-green-500/50',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    HIGH: 'bg-red-500/20 text-red-400 border-red-500/50'
  };

  const riskLabels = {
    LOW: { fr: 'Risque Faible', en: 'Low Risk' },
    MEDIUM: { fr: 'Risque Modéré', en: 'Medium Risk' },
    HIGH: { fr: 'Risque Élevé', en: 'High Risk' }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {staticData.name}
            {stats && stats.balance > 0 && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/50">
                {language === 'fr' ? 'Déjà investi' : 'Already invested'}: {stats.balance} tokens
              </Badge>
            )}
          </DialogTitle>
          
          <DialogDescription className="text-slate-400">
            ID: #{buildingId} • {staticData.coord}, Parse, Europe • {staticData.type[language]}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          {/* Section Gauche: Visuel & Info */}
          <div className="space-y-4">
            {/* Image du bâtiment */}
            <div className="relative h-48 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-700">
              <img 
                src={staticData.img} 
                alt={staticData.name}
                className="h-40 w-auto object-contain drop-shadow-2xl"
              />
              <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
                {language === 'fr' ? 'Immobilier RWA' : 'RWA Real Estate'}
              </Badge>
              
              {/* Badge de type */}
              <Badge 
                className={`absolute top-2 left-2 bg-${staticData.typeColor}-600 text-white`}
              >
                {staticData.type[language]}
              </Badge>
            </div>

            {/* Performances */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <p className="text-xs text-slate-300 uppercase font-bold mb-3">
                {language === 'fr' ? 'Performances' : 'Performance'}
              </p>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-slate-300 mb-1">
                    {language === 'fr' ? 'Rendement' : 'Yield'}
                  </p>
                  <p className="text-xl font-bold text-green-400">
                    {contractData.yieldPercentage}% 
                    <span className="text-xs text-green-300 ml-1">
                      {language === 'fr' ? '/an' : '/year'}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300 mb-1">
                    {language === 'fr' ? 'Prix Unitaire' : 'Unit Price'}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {contractData.pricePerToken}
                    <span className="text-sm text-slate-400 ml-1">USDC</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Niveau de risque IA + Analyse PLU */}
            <Card className="p-4 bg-slate-800/50 border-slate-700 space-y-4">
              {/* Évaluation IA */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-300 uppercase font-bold">
                    {language === 'fr' ? 'Évaluation IA' : 'AI Assessment'}
                  </p>
                  <Badge className={riskColors[staticData.aiReport.riskLevel]}>
                    {riskLabels[staticData.aiReport.riskLevel][language]}
                  </Badge>
                </div>
                
                {/* Opportunités */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <p className="text-xs font-bold text-green-400">
                      {language === 'fr' ? 'Opportunités' : 'Opportunities'}
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {staticData.aiReport.opportunities[language].map((opp, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risques */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <p className="text-xs font-bold text-amber-400">
                      {language === 'fr' ? 'Risques' : 'Risks'}
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {staticData.aiReport.risks[language].map((risk, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Séparateur */}
              <div className="border-t border-slate-700"></div>

              {/* Analyse PLU */}
              <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg flex gap-3 items-start">
                <span className="text-xl">🤖</span>
                <p className="text-xs text-amber-200 leading-relaxed">
                  <span className="font-bold text-amber-300">
                    {language === 'fr' ? 'Analyse PLU :' : 'Zoning Analysis:'}
                  </span> {staticData.pluAlert[language]}
                </p>
              </div>
            </Card>
          </div>

          {/* Section Droite: Formulaire d'achat */}
          <div className="space-y-4">
            {/* Disponibilité */}
            <Card className="p-4 bg-blue-950/20 border-blue-900/50">
              <p className="text-xs text-blue-300 font-bold mb-2 tracking-widest">
                {language === 'fr' ? 'DISPONIBILITÉ' : 'AVAILABILITY'}
              </p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-200">
                  {language === 'fr' ? 'Tokens vendus' : 'Tokens sold'}
                </span>
                <span className="text-white font-semibold">
                  {contractData.mintedSupply} / {contractData.totalSupply}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-1000"
                  style={{ width: `${(contractData.mintedSupply / contractData.totalSupply) * 100}%` }}
                />
              </div>
            </Card>

            {/* Quantité */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold uppercase">
                {language === 'fr' ? 'Quantité à acquérir' : 'Quantity to purchase'}
              </label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
                  onClick={() => setAmount(Math.max(1, amount - 1))}
                >
                  -
                </Button>
                <Input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  className="bg-slate-800 border-slate-600 text-center text-lg font-bold text-white"
                />
                <Button 
                  variant="outline" 
                  className="border-slate-600 bg-slate-800 hover:bg-slate-700 text-white"
                  onClick={() => setAmount(amount + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Total */}
            <div className="p-4 bg-slate-800 rounded-lg border border-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">
                  {language === 'fr' ? 'Total à payer' : 'Total to pay'}
                </span>
                <span className="text-2xl font-black text-white">
                  {(contractData.pricePerToken * amount).toFixed(2)}
                  <span className="text-lg text-slate-400 ml-1">USDC</span>
                </span>
              </div>
            </div>
          </div>
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
            {isFaucetLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Coins className="h-4 w-4 mr-2" />
            )}
            {language === 'fr' ? 'Besoin de MockUSDC ?' : 'Need MockUSDC?'}
          </Button>

          <div className="flex-1 flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  {language === 'fr' ? 'Transaction...' : 'Processing...'}
                </>
              ) : needsApproval ? (
                language === 'fr' ? '1. Approuver USDC' : '1. Approve USDC'
              ) : (
                language === 'fr' ? '2. Confirmer l\'Achat' : '2. Confirm Purchase'
              )}
            </Button>
          </div>
        </DialogFooter>

        {!address && (
          <p className="text-center text-xs text-red-400 mt-2 uppercase tracking-wide">
            ⚠️ {language === 'fr' 
              ? 'Veuillez connecter votre wallet pour interagir avec la blockchain' 
              : 'Please connect your wallet to interact with the blockchain'}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}