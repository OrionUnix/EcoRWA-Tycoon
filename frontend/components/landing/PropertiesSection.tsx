'use client';
import { useState } from 'react';
import Image from 'next/image'; // ✅ On utilise le composant Image natif
import { useTranslations, useLocale } from 'next-intl';

import { BUILDINGS_DATA } from '@/data/buildings';
// Assure-toi que ce composant existe, sinon commente-le temporairement


export default function PropertiesSection() {
  const t = useTranslations('properties');
  const tBuilding = useTranslations('building');
  const locale = useLocale();

  const availableBuildings = BUILDINGS_DATA.filter(b => b.isMintable);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (id: number) => {
    setSelectedBuildingId(id);
    setIsDialogOpen(true);
    // TODO: Implement new purchase dialog
    console.log('🏢 Building selected:', id);
  };

  return (
    <section id="market" className="py-32 bg-[#020617] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* HEADER SECTION */}
        <div className="mb-24 space-y-6">
          <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none italic uppercase">
            {t('title')}
          </h2>
          <p className="max-w-md text-slate-400 text-lg font-medium leading-relaxed border-l-2 border-[#E84142]/30 pl-6">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-40 gap-x-16">
          {availableBuildings.map((building) => {

            const typeKey = building.type.fr.toLowerCase();
            const translatedType = tBuilding(`type.${typeKey}`);

            // ✅ MAPPING DES IMAGES PNG
            const imageConfigs: Record<string, string> = {
              'Résidentiel': '/assets/models/house/saint_germain.webp',
              'Commercial': '/assets/models/house/bistro_central.webp',
              'Mixte': '/assets/models/house/eco_tower_2300.webp',
            };

            const imagePath = imageConfigs[building.type.fr] || '/assets/models/house/saint_germain.png';

            return (
              <div key={building.id} className="group relative flex flex-col items-center">
                {/* Glow dynamique au hover */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#E84142]/0 group-hover:bg-[#E84142]/10 blur-[80px] transition-all duration-700 rounded-full" />

                {/* ✅ IMAGE PREVIEW */}
                <div className="relative w-full h-[380px] z-10 transition-transform duration-700 group-hover:-translate-y-6">
                  <Image
                    src={imagePath}
                    alt={building.name}
                    fill
                    className="object-contain drop-shadow-2xl"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <div className="relative w-full h-[140px] -mt-16 z-20">
                  <div className="absolute inset-0 bg-[#0a0f1e]/80 backdrop-blur-3xl rounded-[32px] border border-white/5 group-hover:border-[#E84142]/40 transition-all duration-500 shadow-2xl" />

                  <div className="absolute inset-0 flex flex-col justify-center px-8 opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 translate-y-2 group-hover:translate-y-0">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-col">
                        <h3 className="text-white font-black uppercase text-sm tracking-tighter mb-1 leading-tight">
                          {building.name}
                        </h3>
                        <div className="flex flex-col">
                          <span className="text-[#E84142] font-bold text-[9px] uppercase tracking-widest mb-0.5">
                            {translatedType}
                          </span>
                          <span className="text-emerald-400 font-bold text-[10px] tracking-widest uppercase">
                            {building.yield} APY
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenDialog(building.id)}
                        className="bg-[#E84142] text-white text-[10px] font-black px-5 py-3 rounded-xl hover:bg-white hover:text-black transition-all cursor-pointer shadow-lg shadow-[#E84142]/20 uppercase"
                      >
                        {tBuilding('buy')}
                      </button>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-300 z-10">
                    <span className="text-white/20 text-[9px] font-black tracking-[0.5em] uppercase italic line-clamp-1 px-4 text-center">
                      {building.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}