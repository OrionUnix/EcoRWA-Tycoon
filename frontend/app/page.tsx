'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BuildingPurchaseDialog from '@/components/BuildingPurchaseDialog';
import { useBuildingInfo } from '@/hooks/useBuildingInfo';
import { useHolderStats } from '@/hooks/useHolderStats';
import { useClaimYield } from '@/hooks/useClaimYield';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const ParseCity3D = dynamic(() => import('@/components/ParseCity3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-800 rounded-xl flex items-center justify-center">
      <p className="text-white">Chargement de la ville 3D...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const { address } = useAccount();

  // Charger les infos des 3 bâtiments
  const { building: building1, refetch: refetch1 } = useBuildingInfo(1);
  const { building: building2, refetch: refetch2 } = useBuildingInfo(2);
  const { building: building3, refetch: refetch3 } = useBuildingInfo(3);

  // Stats du holder pour chaque bâtiment
  const { stats: stats1 } = useHolderStats(1);
  const { stats: stats2 } = useHolderStats(2);
  const { stats: stats3 } = useHolderStats(3);

  // Claim yields
  const { handleClaim, isClaiming } = useClaimYield();

  // Calculer les totaux
  const totalParts = (stats1?.balance || 0) + (stats2?.balance || 0) + (stats3?.balance || 0);
  const totalInvested = (stats1?.investedAmount || 0) + (stats2?.investedAmount || 0) + (stats3?.investedAmount || 0);
  const totalPendingYield = (stats1?.pendingYield || 0) + (stats2?.pendingYield || 0) + (stats3?.pendingYield || 0);
  const totalAnnualYield = (stats1?.annualYield || 0) + (stats2?.annualYield || 0) + (stats3?.annualYield || 0);
  const avgYieldPercentage = totalInvested > 0 ? (totalAnnualYield / totalInvested) * 100 : 0;

  const handleBuildingClick = (buildingData: any) => {
    if (buildingData.id) {
      setSelectedBuildingId(buildingData.id);
      setShowPurchaseDialog(true);
    }
  };

  const handleSuccess = () => {
    // Rafraîchir les données après un achat réussi
    refetch1();
    refetch2();
    refetch3();
  };

  const buildings3D = [
    { id: 1, name: building1?.name, ...building1 },
    { id: 2, name: building2?.name, ...building2 },
    { id: 3, name: building3?.name, ...building3 },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <header className="p-6 flex flex-col md:flex-row justify-between items-center border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">
            🏙️ Parse City
          </h1>
          <p className="text-slate-400">Investissement immobilier tokenisé RWA</p>
        </div>
        <ConnectButton />
      </header>

      {/* Stats Dashboard */}
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
            <p className="text-slate-400 text-sm mb-1">💼 Mes Parts</p>
            <p className="text-3xl font-bold text-white">{totalParts}</p>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
            <p className="text-slate-400 text-sm mb-1">💰 Total Investi</p>
            <p className="text-3xl font-bold text-white">${totalInvested.toFixed(2)}</p>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
            <p className="text-slate-400 text-sm mb-1">📈 Rendement Annuel</p>
            <p className="text-3xl font-bold text-green-400">{avgYieldPercentage.toFixed(2)}%</p>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
            <p className="text-slate-400 text-sm mb-1">💸 Yields à Claim</p>
            <p className="text-3xl font-bold text-yellow-400">${totalPendingYield.toFixed(2)}</p>
          </Card>
        </div>

        {/* Mes investissements détaillés */}
        {address && totalParts > 0 && (
          <Card className="p-6 bg-slate-900/50 border-slate-800 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">📊 Mes Investissements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { building: building1, stats: stats1, id: 1 },
                { building: building2, stats: stats2, id: 2 },
                { building: building3, stats: stats3, id: 3 },
              ].map(({ building, stats, id }) => 
                stats && stats.balance > 0 ? (
                  <Card key={id} className="p-4 bg-slate-800/50 border-slate-700">
                    <h3 className="font-semibold text-white mb-2">{building?.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Parts détenues</span>
                        <span className="text-white font-semibold">{stats.balance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Investi</span>
                        <span className="text-white">${stats.investedAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Yield disponible</span>
                        <span className="text-yellow-400 font-semibold">${stats.pendingYield.toFixed(2)}</span>
                      </div>
                      {stats.pendingYield > 0 && (
                        <Button 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => handleClaim(id)}
                          disabled={isClaiming}
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Claim...
                            </>
                          ) : (
                            <>💸 Claim {stats.pendingYield.toFixed(2)} USDC</>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                ) : null
              )}
            </div>
          </Card>
        )}

        {/* Ville 3D */}
        <ParseCity3D onBuildingClick={handleBuildingClick} />
      </div>

      {/* Dialog d'achat */}
      <BuildingPurchaseDialog
        buildingId={selectedBuildingId}
        isOpen={showPurchaseDialog}
        onClose={() => setShowPurchaseDialog(false)}
        onSuccess={handleSuccess}
      />
    </main>
  );
}