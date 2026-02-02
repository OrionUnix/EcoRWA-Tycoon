// app/[locale]/(user)/user-terminal/modules/Inventory.tsx
'use client';

import { GlassModule } from "../ui/GlassModule";
import { Package, MapPin } from 'lucide-react';

const ASSET_ITEMS = [
  { id: 'glb-01', name: 'STRUCT_CORE_A', type: 'Industrial', status: 'Deployed' },
  { id: 'glb-02', name: 'RES_SEGMENT_B', type: 'Residential', status: 'In Transit' },
];

export function Inventory() {
  return (
    <GlassModule title="ASSET_STORAGE" className="h-full">
      <div className="space-y-3">
        {ASSET_ITEMS.map((item) => (
          <div key={item.id} className="group p-3 border border-white/5 bg-white/5 hover:border-emerald-500/50 transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black italic">{item.name}</h4>
                  <p className="text-[8px] text-slate-500 uppercase">{item.type}</p>
                </div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-400">
                <MapPin size={14} />
              </button>
            </div>
            
            {/* Barre de status style "loading" Tarkov */}
            <div className="mt-3 w-full h-1 bg-black overflow-hidden relative">
              <div 
                className={`absolute inset-y-0 left-0 ${item.status === 'Deployed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} 
                style={{ width: item.status === 'Deployed' ? '100%' : '40%' }} 
              />
            </div>
          </div>
        ))}
      </div>
    </GlassModule>
  );
}