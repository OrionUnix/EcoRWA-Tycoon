import React from 'react';
import { formatNumber } from './GameWidgets';
import { CityStats, PlayerResources } from '../../engine/types';

// ═══════════════════════════════════════
// SimCity 2013 — BOTTOM INFO BAR
// Thin strip: || Time | $Money | +Income/hr | 👥Pop | Bars | Resources
// Height: 36px | Full-width bottom | Dark semi-transparent
// ═══════════════════════════════════════

interface CityInfoBarProps {
    fps: number;
    speed: number;
    paused: boolean;
    onTogglePause: () => void;
    onSetSpeed: (s: number) => void;
    stats: CityStats | null;
    resources: PlayerResources | null;
    onOpenPanel?: (panel: string) => void;
}

// Tiny resource indicator with bar
function ResourceMini({ icon, value, max, color, onClick }: {
    icon: string; value: number; max: number; color: string; onClick?: () => void;
}) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-white/10 transition-all cursor-pointer"
            title={`${formatNumber(value)} / ${formatNumber(max)}`}
        >
            <span className="text-sm">{icon}</span>
            <div className="w-10 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
        </button>
    );
}

export const CityInfoBar: React.FC<CityInfoBarProps> = ({
    fps, speed, paused, onTogglePause, onSetSpeed, stats, resources, onOpenPanel
}) => {
    const population = stats?.population || 0;
    const happiness = stats?.happiness || 0;
    const income = stats?.budget?.income || 0;
    const expenses = stats?.budget?.expenses || 0;
    const net = income - expenses;
    const funds = resources?.money || 0;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[45] pointer-events-auto"
            style={{
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                background: 'linear-gradient(to top, rgba(20,30,48,0.95), rgba(20,30,48,0.85))',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                height: '56px',
            }}
        >
            <div className="flex items-center h-full px-4 gap-6">

                {/* ⏯ PAUSE/PLAY */}
                <button
                    onClick={onTogglePause}
                    className="w-8 h-8 rounded flex items-center justify-center text-sm transition-all hover:scale-110"
                    style={{
                        background: paused ? 'rgba(208,2,27,0.4)' : 'rgba(74,144,226,0.3)',
                        color: 'white',
                    }}
                >
                    {paused ? '⏸' : '▶'}
                </button>

                {/* SPEED */}
                {[1, 2, 4].map(s => (
                    <button
                        key={s}
                        onClick={() => onSetSpeed(s)}
                        className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-all"
                        style={{
                            background: speed === s && !paused ? 'rgba(74,144,226,0.5)' : 'transparent',
                            color: speed === s && !paused ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                    >
                        {s}×
                    </button>
                ))}

                {/* SEPARATOR */}
                <div className="w-px h-6 mx-1.5" style={{ background: 'rgba(255,255,255,0.15)' }} />

                {/* 💲 FUNDS */}
                <button
                    onClick={() => onOpenPanel?.('BUDGET')}
                    className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-white/10 transition-all cursor-pointer"
                >
                    <span className="text-sm">💲</span>
                    <span className="text-base font-bold font-mono" style={{ color: '#7ED321' }}>
                        {formatNumber(funds)}
                    </span>
                </button>

                {/* +INCOME/HR */}
                <button
                    onClick={() => onOpenPanel?.('BUDGET')}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 transition-all cursor-pointer"
                >
                    <span className="text-sm font-bold font-mono" style={{ color: net >= 0 ? '#7ED321' : '#D0021B' }}>
                        {net >= 0 ? '+' : ''}{formatNumber(net)}/hr
                    </span>
                </button>

                {/* SEPARATOR */}
                <div className="w-px h-6 mx-1.5" style={{ background: 'rgba(255,255,255,0.15)' }} />

                {/* 👥 POPULATION */}
                <button
                    onClick={() => onOpenPanel?.('JOBS')}
                    className="flex items-center gap-2 px-1.5 py-0.5 rounded hover:bg-white/10 transition-all cursor-pointer"
                >
                    <span className="text-sm">👥</span>
                    <span className="text-base font-bold font-mono" style={{ color: '#fff' }}>
                        {population === 0 ? 'OK' : formatNumber(population)}
                    </span>
                </button>

                {/* 😊 HAPPINESS */}
                <button
                    onClick={() => onOpenPanel?.('JOBS')}
                    className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white/10 transition-all cursor-pointer"
                >
                    <span className="text-sm">{happiness > 70 ? '😊' : happiness > 40 ? '😐' : '😟'}</span>
                    <span className="text-sm font-bold" style={{ color: happiness > 70 ? '#7ED321' : happiness > 40 ? '#F5A623' : '#D0021B' }}>
                        {population === 0 ? 'OK' : `${happiness}%`}
                    </span>
                </button>

                {/* SEPARATOR */}
                <div className="w-px h-6 mx-1.5" style={{ background: 'rgba(255,255,255,0.15)' }} />

                {/* UTILITY BARS (Water, Power) */}
                <ResourceMini icon="💧" value={stats?.water?.consumed || 0} max={stats?.water?.produced || 1} color="#50E3C2" onClick={() => onOpenPanel?.('WATER')} />
                <ResourceMini icon="⚡" value={stats?.energy?.consumed || 0} max={stats?.energy?.produced || 1} color="#F8E71C" onClick={() => onOpenPanel?.('POWER')} />

                {/* SEPARATOR */}
                <div className="w-px h-6 mx-1.5" style={{ background: 'rgba(255,255,255,0.15)' }} />

                {/* RESOURCE STOCKS (Wood, Minerals, Oil, Coal, Iron, Gold, Silver) */}
                <ResourceMini icon="🌲" value={resources?.wood || 0} max={5000} color="#7ED321" />
                <ResourceMini icon="⛏️" value={resources?.iron || 0} max={5000} color="#E65100" />
                <ResourceMini icon="🛢️" value={resources?.oil || 0} max={5000} color="#F5A623" />
                <ResourceMini icon="⚫" value={resources?.coal || 0} max={5000} color="#607D8B" />
                <ResourceMini icon="🪙" value={resources?.gold || 0} max={1000} color="#FFD600" />
                <ResourceMini icon="🥈" value={resources?.silver || 0} max={1000} color="#90A4AE" />

                {/* SPACER */}
                <div className="flex-1" />

                {/* FPS (subtle) */}
                <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{fps}</span>
            </div>
        </div>
    );
};
