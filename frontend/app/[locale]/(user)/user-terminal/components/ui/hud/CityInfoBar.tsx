import React from 'react';
import { formatNumber } from './GameWidgets';
import { CityStats, PlayerResources } from '../../../engine/types';

// ═══════════════════════════════════════
// SimCity 2013 — BOTTOM INFO BAR
// Thin strip: || Time | $Money | +Income/hr | 👥Pop | Bars | Resources
// Height: 36px | Full-width bottom | Dark semi-transparent
// ═══════════════════════════════════════

interface CityInfoBarProps {
    fps: number;
    stats: CityStats | null;
    resources: PlayerResources | null;
    onOpenPanel?: (panel: string) => void;
}

// Tiny resource indicator with bar
function ResourceMini({ icon, value, max, color, onClick, label }: {
    icon: string; value: number; max: number; color: string; onClick?: () => void; label?: string;
}) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-all cursor-pointer"
            title={label ? `${label} : ${formatNumber(value)} / ${formatNumber(max)}` : `${formatNumber(value)} / ${formatNumber(max)}`}
        >
            <span className="text-sm">{icon}</span>
            <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold font-mono leading-none mb-1" style={{ color: '#fff' }}>
                    {formatNumber(value)}<span className="text-gray-400">/{formatNumber(max)}</span>
                </span>
                <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
            </div>
        </button>
    );
}

export const CityInfoBar: React.FC<CityInfoBarProps> = ({
    fps, stats, resources, onOpenPanel
}) => {
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

                {/* UTILITY BARS (Water, Power) */}
                <ResourceMini icon="💧" value={stats?.water?.consumed || 0} max={stats?.water?.produced || 1} color="#50E3C2" onClick={() => onOpenPanel?.('WATER')} />
                <ResourceMini icon="⚡" value={stats?.energy?.consumed || 0} max={stats?.energy?.produced || 1} color="#F8E71C" onClick={() => onOpenPanel?.('POWER')} />

                {/* SEPARATOR */}
                <div className="w-px h-6 mx-1.5" style={{ background: 'rgba(255,255,255,0.15)' }} />

                {/* RESOURCE STOCKS (Wood, Minerals, Oil, Coal, Iron, Gold, Silver) */}
                <ResourceMini icon="🌲" label="Bois" value={resources?.wood || 0} max={5000} color="#7ED321" />
                <ResourceMini icon="⛏️" label="Fer" value={resources?.iron || 0} max={5000} color="#E65100" />
                <ResourceMini icon="🛢️" label="Pétrole" value={resources?.oil || 0} max={5000} color="#F5A623" />
                <ResourceMini icon="⚫" label="Charbon" value={resources?.coal || 0} max={5000} color="#607D8B" />
                <ResourceMini icon="🪙" label="Or" value={resources?.gold || 0} max={1000} color="#FFD600" />
                <ResourceMini icon="🥈" label="Argent" value={resources?.silver || 0} max={1000} color="#90A4AE" />

                {/* SPACER */}
                <div className="flex-1" />

                {/* FPS (subtle) */}
                <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>{fps}</span>
            </div>
        </div>
    );
};
