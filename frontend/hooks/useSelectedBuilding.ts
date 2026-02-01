'use client';

import { create } from 'zustand';
import type { AssetPackBuilding } from './useAssetPacks';

interface SelectedBuildingStore {
    selectedBuilding: AssetPackBuilding | null;
    selectBuilding: (building: AssetPackBuilding | null) => void;
}

export const useSelectedBuilding = create<SelectedBuildingStore>((set) => ({
    selectedBuilding: null,
    selectBuilding: (building) => set({ selectedBuilding: building }),
}));
