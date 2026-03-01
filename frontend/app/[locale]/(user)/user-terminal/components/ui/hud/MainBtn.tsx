import React from 'react';

interface MainBtnProps {
    id: string;
    icon: string;
    label: string;
    color: string;
    active: boolean;
    onClick: () => void;
}


export function MainBtn({ id: _id, icon, label, color: _color, active, onClick }: MainBtnProps) {
    return (
        <div className="relative group p-2">
            <button
                onClick={onClick}
                title={label}
                className={`flex items-center justify-center transition-transform duration-200 cursor-pointer hover:scale-110 active:scale-95 ${active ? 'scale-110 brightness-110' : ''}`}
                style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: 0,
                    outline: 'none',
                }}
            >
                {icon && typeof icon === 'string' && icon.startsWith('/') ? (
                    <img
                        src={icon}
                        alt={label}
                        className="w-16 h-16 drop-shadow-lg"
                        style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                    />
                ) : (
                    <span className="text-5xl drop-shadow-lg" style={{ imageRendering: 'pixelated' }}>
                        {icon || '❓'}
                    </span>
                )}
            </button>
            {/* Label tooltip hover */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                <div className="px-3 py-1 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold rounded-lg whitespace-nowrap shadow-xl border border-white/10 uppercase tracking-tighter">
                    {label}
                </div>
            </div>
        </div>
    );
}
