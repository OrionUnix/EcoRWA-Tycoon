import React from 'react';
import { formatNumber } from '@/app/[locale]/(user)/user-terminal/components/ui/widgets/helpers';

/**
 * Petit affichage de ressource pour la barre du haut
 */
export function ResourceItem({ label, value, color }: {
    label: string;
    value: number | undefined;
    color: string;
}) {
    return (
        <div className="flex flex-col items-center min-w-[40px]">
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">{label}</span>
            <span className={`font-mono font-bold text-sm ${color}`}>
                {formatNumber(value)}
            </span>
        </div>
    );
}
