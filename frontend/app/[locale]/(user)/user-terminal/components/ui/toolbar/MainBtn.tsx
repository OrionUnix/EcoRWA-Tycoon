import React from 'react';

interface MainBtnProps {
    id: string;
    icon: string;
    label: string;
    color: string;
    active: boolean;
    onClick: () => void;
}

/**
 * Bouton principal rond de la barre du bas (SimCity 2013 style)
 */
export function MainBtn({ id: _id, icon, label, color, active, onClick }: MainBtnProps) {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                title={label}
                className="flex items-center justify-center transition-all duration-150"
                style={{
                    width: 44, height: 44,
                    borderRadius: '50%',
                    background: active
                        ? `linear-gradient(145deg, ${color}, ${color}CC)`
                        : `linear-gradient(145deg, ${color}BB, ${color}66)`,
                    boxShadow: active
                        ? `0 4px 16px ${color}70, 0 0 0 2.5px rgba(255,255,255,0.9), 0 0 0 4px ${color}50`
                        : '0 2px 8px rgba(0,0,0,0.25)',
                    fontSize: 18,
                    transform: active ? 'translateY(-5px)' : 'translateY(0)',
                    color: 'white',
                }}
            >
                {icon}
            </button>
            {/* Label tooltip hover */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap bg-black/80 text-white">{label}</div>
            </div>
        </div>
    );
}
