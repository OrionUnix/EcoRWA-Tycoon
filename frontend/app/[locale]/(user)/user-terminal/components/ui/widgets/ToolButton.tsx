import React from 'react';

/**
 * Bouton d'outil polyvalent
 * variant="square" (sous-menus) | variant="circle" (barre principale)
 */
export function ToolButton({ active, onClick, label, icon, color, variant = 'square' }: {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: string;
    color?: string;
    variant?: 'square' | 'circle';
}) {
    const isCircle = variant === 'circle';

    const baseClass = `flex flex-col items-center justify-center transition-all duration-200 relative group
        ${isCircle ? 'w-12 h-12 rounded-full border-2' : 'w-14 h-14 rounded-xl border'}`;

    const activeClass = active
        ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-95'
        : `border-white/10 hover:border-white/40 ${color || 'bg-white/5 hover:bg-white/10'}`;

    return (
        <button onClick={onClick} className={`${baseClass} ${activeClass}`}>
            <span className={`${isCircle ? 'text-xl' : 'text-2xl'} drop-shadow-md`}>{icon}</span>
            <span className="absolute -bottom-1 text-[7px] uppercase font-black text-white bg-black/80 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {label}
            </span>
        </button>
    );
}
