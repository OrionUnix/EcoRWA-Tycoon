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
 * Item compact du sous-menu (ruban horizontal)
 */
export function RibbonItem({ active, onClick, icon, label, cost, color, resourceCost }: RibbonItemProps) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-150 hover:scale-105 min-w-[64px] group"
            style={{
                background: active ? `${color}25` : 'rgba(255,255,255,0.04)',
                border: active ? `1.5px solid ${color}80` : '1.5px solid rgba(255,255,255,0.08)',
            }}
        >
            {/* Icône */}
            <div
                className="flex items-center justify-center text-base transition-transform group-hover:scale-110"
                style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `linear-gradient(145deg, ${color}CC, ${color}88)`,
                    boxShadow: active ? `0 0 12px ${color}60` : '0 2px 6px rgba(0,0,0,0.3)',
                    fontSize: 16,
                }}
            >
                {icon}
            </div>

            {/* Nom */}
            <span
                className="text-[10px] font-semibold leading-tight text-center whitespace-nowrap max-w-[72px] overflow-hidden text-ellipsis"
                style={{ color: active ? '#fff' : 'rgba(255,255,255,0.7)' }}
            >
                {label}
            </span>

            {/* Prix */}
            {cost !== undefined && (
                <span
                    className="text-[10px] flex items-center gap-1 flex-wrap justify-center mt-0.5 leading-tight"
                    style={{ color: active ? '#fbbf24' : '#d1d5db', whiteSpace: 'pre-wrap', textAlign: 'center' }}
                >
                    Coût : {cost}$
                    {resourceCost && Object.entries(resourceCost).map(([res, amt]) => (
                        <span key={res} className="whitespace-nowrap">
                            , {amt} {RES_ICONS[res] || ''} {RES_NAMES[res] || res}
                        </span>
                    ))}
                </span>
            )}
        </button>
    );
}
