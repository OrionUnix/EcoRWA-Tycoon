import React, { useState, useEffect } from 'react';

/**
 * SaveIndicator - Petit indicateur visuel style Win95 (Disquette)
 * Écoute l'événement 'game-saving' pour s'afficher
 */
export const SaveIndicator: React.FC = () => {
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            setIsSaving(e.detail);
        };
        window.addEventListener('game-saving', handler);
        return () => window.removeEventListener('game-saving', handler);
    }, []);

    if (!isSaving) return null;

    return (
        <div className="fixed bottom-4 right-4 flex items-center gap-3 px-3 py-2 bg-[#c3c7cb] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#868a8e] shadow-[2px_2px_0_0_#000] z-[9999] font-sans pointer-events-none">
            {/* Floppy Disk Icon (Emoji fallback or placeholder) */}
            <div className="text-xl animate-pulse">💾</div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-tighter text-black leading-none">System</span>
                <span className="text-[12px] font-black uppercase text-blue-800 leading-tight">Saving...</span>
            </div>
            {/* Petit voyant "LED" */}
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse border border-black ml-1"></div>
        </div>
    );
};
