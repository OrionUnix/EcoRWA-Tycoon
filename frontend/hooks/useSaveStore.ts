import { create } from 'zustand';

export type SaveMode = 'none' | 'web2' | 'web3' | null;

interface SaveStore {
    saveMode: SaveMode;
    userId: string | null;
    setSaveMode: (mode: SaveMode) => void;
    setUserId: (id: string | null) => void;
}

export const useSaveStore = create<SaveStore>((set) => ({
    saveMode: null, // null means we are at the Start Screen and haven't chosen yet
    userId: null,
    setSaveMode: (mode) => set({ saveMode: mode }),
    setUserId: (id) => set({ userId: id }),
}));
