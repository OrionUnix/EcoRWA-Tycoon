'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';

// Components
import Navbar from '@/components/layout/Navbar';
import Dashboard from '@/components/dashboard/Dashboard';
import PropertiesView from '@/components/dashboard/PropertiesView';
import LandingPage from '@/components/LandingPage';
import BuildingPurchaseDialog from '@/components/BuildingPurchaseDialog';
import Footer from '@/components/Footer';

// Hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useFaucet } from '@/hooks/useFaucet';

// Dynamic imports
const ParseCity3D = dynamic(() => import('@/components/ParseCity3D'), { ssr: false });

type ViewType = 'city' | 'dashboard' | 'properties' | 'analytics';

export default function Home() {
  const [locale, setLocale] = useState('fr');
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('city');
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  
  const { address } = useAccount();
  const { usdcBalance, buildings } = useDashboardData();
  const { claimUSDC, isLoading: isFaucetLoading } = useFaucet();

  // Translation function
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        'navbar.balance': 'Solde',
        'navbar.faucet': 'Faucet USDC',
        'appName': 'EcoRWA',
        'tagline': 'Gamifying Real Estate',
        'balance': 'Solde',
        'faucet': 'Faucet',
      },
      en: {
        'navbar.balance': 'Balance',
        'navbar.faucet': 'USDC Faucet',
        'appName': 'EcoRWA',
        'tagline': 'Gamifying Real Estate',
        'balance': 'Balance',
        'faucet': 'Faucet',
      }
    };
    return translations[locale]?.[key] || key;
  };

  // Show landing page for non-connected users
  if (showLanding && !address) {
    return (
      <LandingPage 
        onGetStarted={() => setShowLanding(false)} 
        locale={locale as 'fr' | 'en'} 
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <Navbar 
        address={address} 
        usdcBalance={usdcBalance}
        isFaucetLoading={isFaucetLoading}
        onClaimUSDC={claimUSDC}
        currentView={currentView}
        onNavigate={setCurrentView}
        t={t}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* City View - 3D immersive experience */}
        {currentView === 'city' && (
          <div className="relative">
            <div className="h-screen w-full">
              <ParseCity3D 
                onBuildingClick={(data: any) => setSelectedBuildingId(data.id)} 
              />
            </div>
            
            {/* Compact Floating Properties List */}
            <div className="fixed bottom-6 left-6 right-6 z-20 max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 rounded-2xl p-6 border border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Available Properties
                  </h3>
                  <button
                    onClick={() => setCurrentView('properties')}
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    View All →
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {buildings.slice(0, 3).map((building) => (
                    <CompactPropertyCard
                      key={building.id}
                      building={building}
                      onClick={() => setSelectedBuildingId(building.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="container mx-auto px-6 max-w-7xl">
            <Dashboard 
              onBuildingSelect={(id) => setSelectedBuildingId(id)}
              t={t}
            />
          </div>
        )}

        {/* Properties View - Only available properties */}
        {currentView === 'properties' && (
          <div className="container mx-auto px-6 max-w-7xl">
            <PropertiesView onBuildingSelect={setSelectedBuildingId} />
          </div>
        )}

        {/* Analytics View */}
        {currentView === 'analytics' && (
          <div className="container mx-auto px-6 max-w-7xl pt-20">
            <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
              <h2 className="text-3xl font-bold text-white mb-6">Analytics</h2>
              <p className="text-slate-400">Coming soon...</p>
            </div>
          </div>
        )}

        {/* Footer - Only show on non-city views */}
        {currentView !== 'city' && <Footer />}
      </div>

      {/* Purchase Dialog */}
      <BuildingPurchaseDialog 
        buildingId={selectedBuildingId} 
        isOpen={!!selectedBuildingId} 
        onClose={() => setSelectedBuildingId(null)} 
      />
    </main>
  );
}

// Compact Property Card for City View
interface CompactPropertyCardProps {
  building: any;
  onClick: () => void;
}

function CompactPropertyCard({ building, onClick }: CompactPropertyCardProps) {
  const name = building.name || `Building ${building.id}`;
  const partPrice = building.partPrice || 0;
  const annualYield = building.annualYield || 0;
  const totalParts = building.totalParts || 0;

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 hover:scale-105"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-white/10 group-hover:border-emerald-500/30 transition-all duration-300" />
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
      
      <div className="relative space-y-3">
        <h4 className="text-base font-bold text-white">{name}</h4>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Price</p>
            <p className="font-bold text-white">${partPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Yield</p>
            <p className="font-bold text-emerald-400">{annualYield.toFixed(2)}%</p>
          </div>
        </div>
        
        <div className="pt-2">
          <div className="w-full bg-slate-700/50 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-1.5 rounded-full w-2/3" />
          </div>
          <p className="text-xs text-slate-400 mt-1">{totalParts} parts available</p>
        </div>
      </div>
    </button>
  );
}