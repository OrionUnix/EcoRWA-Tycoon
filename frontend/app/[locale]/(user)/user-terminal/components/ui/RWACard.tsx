import React from 'react';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

interface RWACardProps {
    id: number;
    title: string;
    description: string;
    cost: number;
    apy: string;
    imageName: string; // ex: 'loft', 'bistro', 'eco'
    colorTheme: 'blue' | 'orange' | 'green';
    onInvest?: () => void;
    investButtonText: string;
    isDisabled?: boolean;
}

export const RWACard: React.FC<RWACardProps> = ({
    title,
    description,
    cost,
    apy,
    imageName,
    colorTheme,
    onInvest,
    investButtonText,
    isDisabled = false
}) => {
    // Définition des couleurs selon le thème
    const themes = {
        blue: {
            bg: 'bg-[#89CFF0]', // Fond ciel clair
            header: 'bg-[#2B547E]', // Entête sombre
            border: 'border-[#4682B4]'
        },
        orange: {
            bg: 'bg-[#FFB07C]',
            header: 'bg-[#C35817]',
            border: 'border-[#E66C2C]'
        },
        green: {
            bg: 'bg-[#77DD77]',
            header: 'bg-[#347C2C]',
            border: 'border-[#4E9258]'
        }
    };

    const theme = themes[colorTheme];

    return (
        <div className={`relative flex flex-col w-full rounded-2xl border-4 ${theme.border} ${theme.bg} overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-1 ${isDisabled ? 'opacity-50 grayscale pointer-events-none' : ''}`}>

            {/* Zone d'image (Ciel/Fond avec le sprite isométrique) */}
            <div className="relative h-48 w-full flex items-center justify-center p-4">
                {/* Nuages stylisés en CSS pour le fond (optionnel, donne un effet carte) */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_white_20%,_transparent_60%)]"></div>

                {/* L'image du bâtiment isométrique */}
                <img
                    src={withBasePath(`/assets/isometric/Spritesheet/Buildings/RWA/${imageName}.png`)}
                    alt={title}
                    className="h-full object-contain pixelated drop-shadow-xl z-10"
                    // Fallback de sécurité si l'image n'est pas trouvée
                    onError={(e) => {
                        e.currentTarget.src = withBasePath('/assets/isometric/Spritesheet/Buildings/RWA/loft.png');
                    }}
                />
            </div>

            {/* Zone d'informations (Texte sombre) */}
            <div className={`flex flex-col flex-grow ${theme.header} p-4 text-white border-t-4 ${theme.border}`}>
                <h3 className="text-xl font-black uppercase tracking-wider mb-1 truncate">{title}</h3>
                <p className="text-xs font-medium leading-tight mb-4 flex-grow opacity-90">{description}</p>

                <div className="flex justify-between items-end mb-4 text-sm">
                    <div className="flex flex-col">
                        <span className="opacity-70 text-[10px] uppercase font-bold">Coût RWA</span>
                        <span className="font-black text-yellow-300 drop-shadow-md">🪙 {cost} USDC</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="opacity-70 text-[10px] uppercase font-bold">Rendement</span>
                        <span className="font-black text-emerald-300 drop-shadow-md">📈 {apy} APY</span>
                    </div>
                </div>

                {/* Bouton d'action */}
                {onInvest && (
                    <button
                        onClick={onInvest}
                        className="w-full py-2 bg-white/20 hover:bg-white/30 active:bg-black/20 border-2 border-white/50 rounded-lg font-black uppercase tracking-widest transition-colors shadow-inner"
                    >
                        {investButtonText}
                    </button>
                )}
            </div>
        </div>
    );
};