'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface GameControlsProps {
    speed: number;
    paused: boolean;
    demandR: number;
    demandC: number;
    demandI: number;
    onSetSpeed: (s: number) => void;
    onTogglePause: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({ speed, paused, demandR, demandC, demandI, onSetSpeed, onTogglePause }) => {
    const t = useTranslations('hud');

    return (
        <div className="flex items-center gap-2">
            {/* RCI Bars */}
            <div className="flex items-end gap-[2px] h-[40px] px-2 bg-slate-800 border-4 border-black p-1 shadow-[2px_2px_0_0_#fff]">
                <div className="w-2 bg-[#10b981]" style={{ height: `${Math.max(10, demandR)}%` }} title="Residential Demand"></div>
                <div className="w-2 bg-[#3b82f6]" style={{ height: `${Math.max(10, demandC)}%` }} title="Commercial Demand"></div>
                <div className="w-2 bg-[#eab308]" style={{ height: `${Math.max(10, demandI)}%` }} title="Industrial Demand"></div>
            </div>

            {/* Speed Controls */}
            <div className="flex items-center gap-1 bg-slate-300 border-4 border-black p-1 shadow-[4px_4px_0_0_#000] h-[50px]">
                <button
                    onClick={onTogglePause}
                    className={`w-10 h-8 flex items-center justify-center text-sm font-black border-2 border-black transition-none rounded-none ${paused
                        ? 'bg-red-500 text-white translate-y-[2px] translate-x-[2px] shadow-none'
                        : 'bg-slate-100 text-black shadow-[2px_2px_0_0_#000] hover:bg-white active:translate-y-[2px] active:translate-x-[2px] active:shadow-none'
                        }`}
                    title={t('TopBar.pause')}
                >
                    ||
                </button>
                {[1, 2, 4].map(s => {
                    const isActive = speed === s && !paused;
                    return (
                        <button
                            key={s}
                            onClick={() => onSetSpeed(s)}
                            className={`w-10 h-8 flex items-center justify-center text-sm font-black border-2 border-black transition-none rounded-none ${isActive
                                ? 'bg-green-500 text-white translate-y-[2px] translate-x-[2px] shadow-none'
                                : 'bg-slate-100 text-black shadow-[2px_2px_0_0_#000] hover:bg-white active:translate-y-[2px] active:translate-x-[2px] active:shadow-none'
                                }`}
                            title={`${t('TopBar.speed')} ${s}x`}
                        >
                            {s}x
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
