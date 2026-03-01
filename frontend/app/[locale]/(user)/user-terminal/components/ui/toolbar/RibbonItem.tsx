import React from 'react';
import { RES_ICONS, RES_NAMES } from '../../../hooks/useToolbarState';

interface RibbonItemProps {
    active: boolean;
    onClick: () => void;
    icon: string;
    label: string;
    cost?: number;
    resourceCost?: Record<string, number>;
    color: string;
}

/**
 * RibbonItem - Modern Borderless Version
 * Standalone icon for submenus.
 */
export function RibbonItem({ active, onClick, icon, label, cost, color: _color, resourceCost }: RibbonItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 p-2 transition-transform duration-200 cursor-pointer hover:scale-110 active:scale-95 group ${active ? 'scale-110' : ''}`}
            style={{
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
            }}
        >
            {/* Icône */}
            <div
                className="flex items-center justify-center"
                style={{
                    width: 56, height: 56,
                    imageRendering: 'pixelated',
                }}
            >
                {icon && typeof icon === 'string' && icon.startsWith('/') ? (
                    <img
                        src={icon}
                        alt={label}
                        className="w-14 h-14 drop-shadow-lg"
                        style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                    />
                ) : (
                    <span className="text-4xl drop-shadow-lg">{icon || '❓'}</span>
                )}
            </div>

            {/* Nom */}
            <span
                className={`text-[11px] font-black uppercase tracking-tight leading-tight text-center drop-shadow-md whitespace-nowrap px-1 py-0.5 rounded ${active ? 'bg-yellow-400 text-black' : 'text-white bg-black/40'}`}
            >
                {label}
            </span>

            {/* Prix */}
            {cost !== undefined && (
                <span
                    className="text-[10px] flex items-center gap-1 flex-wrap justify-center mt-0.5 leading-tight font-bold bg-black/60 text-white px-1.5 rounded-full shadow-lg"
                >
                    ${cost}
                    {resourceCost && Object.entries(resourceCost).map(([res, amt]) => (
                        <span key={res} className="flex items-center gap-0.5">
                            | {amt}{RES_ICONS[res] && RES_ICONS[res].startsWith('/') ? <img src={RES_ICONS[res]} className="w-3 h-3 pixelated" alt={res} /> : RES_ICONS[res]}
                        </span>
                    ))}
                </span>
            )}
        </button>
    );
}
