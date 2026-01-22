'use client';
import { Building2, TrendingUp, Coins, MapPin } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

interface PropertiesViewProps {
  onBuildingSelect: (buildingId: number) => void;
}

export default function PropertiesView({ onBuildingSelect }: PropertiesViewProps) {
  const { buildings, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-20 pb-12">
      <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 rounded-3xl p-8 border border-white/10 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Active Properties</h2>
          <p className="text-slate-400">Overview of available investment opportunities</p>
        </div>

        {/* Properties Table */}
        <div className="space-y-4">
          {buildings.map((building) => (
            <PropertyRow
              key={building.id}
              building={building}
              onClick={() => onBuildingSelect(building.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PropertyRowProps {
  building: any;
  onClick: () => void;
}

function PropertyRow({ building, onClick }: PropertyRowProps) {
  const name = building.name || `Building ${building.id}`;
  const partPrice = building.partPrice || 0;
  const totalParts = building.totalParts || 0;
  const mintedParts = building.mintedParts || 0;
  const annualYield = building.annualYield || 0;
  const availableParts = totalParts - mintedParts;

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Background with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border border-white/10 group-hover:border-emerald-500/30 transition-all duration-300" />
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-blue-500/0 group-hover:from-emerald-500/10 group-hover:to-blue-500/10 transition-all duration-300" />
      
      <div className="relative p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
          {/* Property Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-4">
              {/* Property Icon/Image */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              
              {/* Property Details */}
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <MapPin className="w-3 h-3" />
                  <span>Parse, Europe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location/Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-xs text-slate-400">Status</p>
              <p className="text-sm font-semibold text-emerald-400">Active</p>
            </div>
          </div>

          {/* Availability */}
          <div>
            <p className="text-xs text-slate-400 mb-1">Availability</p>
            <p className="text-sm font-bold text-white">{availableParts} / {totalParts} parts</p>
            <div className="mt-1 w-full bg-slate-700/50 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(availableParts / totalParts) * 100}%` }}
              />
            </div>
          </div>

          {/* Yield */}
          <div>
            <p className="text-xs text-slate-400 mb-1">Annual Yield</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-bold text-emerald-400">{annualYield.toFixed(2)}%</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Price per Part</p>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-blue-400" />
                <p className="text-lg font-bold text-white">${partPrice.toFixed(2)}</p>
              </div>
            </div>
            
            {/* Action Button */}
            <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
              Invest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}