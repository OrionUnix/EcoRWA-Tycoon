'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Import dynamique pour éviter les erreurs SSR avec Three.js
const ParseCity3D = dynamic(() => import('@/components/ParseCity3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-800 rounded-xl flex items-center justify-center">
      <p className="text-white">Chargement de la ville 3D...</p>
    </div>
  ),
});

export default function Home() {
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

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
            <p className="text-3xl font-bold text-white">0</p>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
            <p className="text-slate-400 text-sm mb-1">💰 Total Investi</p>
            <p className="text-3xl font-bold text-white">$0.00</p>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
            <p className="text-slate-400 text-sm mb-1">📈 Rendement Annuel</p>
            <p className="text-3xl font-bold text-green-400">0.00%</p>
          </Card>
          <Card className="p-6 bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
            <p className="text-slate-400 text-sm mb-1">💸 Yields à Claim</p>
            <p className="text-3xl font-bold text-yellow-400">$0.00</p>
          </Card>
        </div>

        {/* Ville 3D */}
        <div className="relative">
          <ParseCity3D onBuildingClick={setSelectedBuilding} />

          {/* Panel d'info */}
          {selectedBuilding && (
            <div className="absolute bottom-4 left-4 right-4">
              <Card className="p-6 bg-slate-900/95 backdrop-blur-xl border-slate-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {selectedBuilding.name || 'Bâtiment décoratif'}
                    </h3>
                    {selectedBuilding.name && (
                      <div className="flex gap-2">
                        <Badge>Yield: 4-8%</Badge>
                        <Badge variant="outline">150-250 USDC</Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBuilding(null)}
                  >
                    ✕
                  </Button>
                </div>
                {selectedBuilding.name && (
                  <Button className="w-full">🏗️ Acheter des parts</Button>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}