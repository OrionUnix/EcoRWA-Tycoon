'use client';
import { useState } from 'react';
import { TrendingUp, Wallet, DollarSign, PieChart, Building2, ChevronRight, Sparkles } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useClaimYield } from '@/hooks/useClaimYield';

interface DashboardProps {
  onBuildingSelect: (buildingId: number) => void;
  t: (key: string) => string;
}

export default function Dashboard({ onBuildingSelect, t }: DashboardProps) {
  const { buildings, totals, isLoading } = useDashboardData();
  const { handleClaim, isClaiming } = useClaimYield();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400 animate-pulse" />
        </div>
      </div>
    );
  }

  const hasInvestments = totals.parts > 0;

  return (
    <div className="space-y-8 pt-20 pb-12">
      {/* Hero Stats - Glassmorphism cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<PieChart className="w-6 h-6" />}
          label="Total Parts"
          value={totals.parts.toString()}
          gradient="from-violet-500 to-purple-600"
          delay={0}
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Total Invested"
          value={`${totals.invested.toFixed(2)}`}
          gradient="from-blue-500 to-cyan-600"
          delay={100}
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Avg Yield"
          value={`${totals.avgYield.toFixed(2)}%`}
          gradient="from-emerald-500 to-green-600"
          highlight={totals.avgYield > 5}
          delay={200}
        />
        <StatCard
          icon={<Wallet className="w-6 h-6" />}
          label="Pending Rewards"
          value={`${totals.pending.toFixed(2)}`}
          gradient="from-amber-500 to-orange-600"
          pulse={totals.pending > 0}
          delay={300}
        />
      </div>

      {/* Portfolio Overview - Only show if user has investments */}
      {hasInvestments && (
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
                  Your Portfolio
                </h2>
                <p className="text-slate-400">Manage your real estate investments</p>
              </div>
              {/* Global claim button removed temporarily */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {buildings
                .filter(building => building.stats && building.stats.balance > 0)
                .map((building, idx) => (
                  <BuildingCard
                    key={building.id}
                    building={building}
                    isHovered={hoveredCard === building.id}
                    onHover={() => setHoveredCard(building.id)}
                    onLeave={() => setHoveredCard(null)}
                    onClick={() => onBuildingSelect(building.id)}
                    onClaim={() => handleClaim(building.id)}
                    isClaiming={isClaiming}
                    delay={idx * 100}
                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component with glassmorphism
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  highlight?: boolean;
  pulse?: boolean;
  delay?: number;
}

function StatCard({ icon, label, value, gradient, highlight, pulse, delay = 0 }: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl transform hover:scale-105 transition-all duration-500"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10" />

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />

      {pulse && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 animate-pulse`} />
      )}

      <div className="relative z-10 p-6">
        <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${gradient} mb-4 shadow-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        <p className="text-slate-400 text-sm mb-2">{label}</p>
        <p className={`text-4xl font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>
          {value}
        </p>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </div>
  );
}

// Building Card with enhanced glassmorphism
interface BuildingCardProps {
  building: any;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  onClaim: () => void;
  isClaiming: boolean;
  delay?: number;
}

function BuildingCard({ building, isHovered, onHover, onLeave, onClick, onClaim, isClaiming, delay = 0 }: BuildingCardProps) {
  const name = building.name || `Building ${building.id}`;
  const balance = building.stats?.balance || 0;
  const investedAmount = building.stats?.investedAmount || 0;
  const annualYield = building.annualYield || 0;
  const pendingYield = building.stats?.pendingYield || 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transform transition-all duration-500 ${isHovered ? 'scale-105' : ''}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-white/10" />

      {/* Glow effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 blur-xl" />
      )}

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {balance} parts owned
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl backdrop-blur-sm">
            <span className="text-slate-400">Invested</span>
            <span className="text-white font-bold">${investedAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-xl backdrop-blur-sm border border-emerald-500/20">
            <span className="text-slate-400">Yield</span>
            <span className="text-emerald-400 font-bold">${annualYield.toFixed(2)}/yr</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-amber-500/10 rounded-xl backdrop-blur-sm border border-amber-500/20">
            <span className="text-slate-400">Pending</span>
            <span className="text-amber-400 font-bold">${pendingYield.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {pendingYield > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaim(); }}
              disabled={isClaiming}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 disabled:opacity-50"
            >
              Claim
            </button>
          )}
          <button
            onClick={onClick}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold transition-all duration-300 border border-white/10"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

// Property Card with glassmorphism
interface PropertyCardProps {
  building: any;
  onClick: () => void;
  delay?: number;
}

function PropertyCard({ building, onClick, delay = 0 }: PropertyCardProps) {
  const partPrice = building.partPrice || 0;
  const totalParts = building.totalParts || 0;
  const annualYield = building.annualYield || 0;
  const name = building.name || `Building ${building.id}`;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl cursor-pointer transform hover:scale-105 transition-all duration-500"
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10" />

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-500" />

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl backdrop-blur-sm">
            <span className="text-slate-400">Part Price</span>
            <span className="text-white font-bold">${partPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl backdrop-blur-sm">
            <span className="text-slate-400">Total Parts</span>
            <span className="text-white font-bold">{totalParts}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-xl backdrop-blur-sm border border-emerald-500/20">
            <span className="text-slate-400">Annual Yield</span>
            <span className="text-emerald-400 font-bold">{annualYield.toFixed(2)}%</span>
          </div>
        </div>

        <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold group-hover:shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-300">
          Invest Now
        </button>
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
    </div>
  );
}