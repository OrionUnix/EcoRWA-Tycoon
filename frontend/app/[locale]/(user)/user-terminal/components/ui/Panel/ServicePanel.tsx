import React from 'react';
import { GlassPanel } from './GlassPanel';

// ═══════════════════════════════════════
// SimCity 2013 — GENERIC SERVICE PANEL
// Reusable overlay panel shell
// ═══════════════════════════════════════

interface ServicePanelProps {
    title: React.ReactNode | string;
    icon: string;
    color: string;
    onClose: () => void;
    children: React.ReactNode;
    width?: string; // e.g. 'w-[800px]' or 'max-w-4xl'
}

export const ServicePanel: React.FC<ServicePanelProps> = ({ title, icon, color, onClose, children, width = 'w-[420px]' }) => {
    return (
        <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] pointer-events-auto"
            style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", animation: 'panelIn 0.25s ease-out' }}
        >
            {/* Backdrop */}
            <div className="fixed inset-0 -z-10" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />

            <div className="bg-slate-300 border-4 border-black shadow-[8px_8px_0_0_#000] rounded-none p-0 overflow-hidden max-h-[80vh] flex flex-col">
                <div className={`flex flex-col ${width} max-h-[80vh]`}>

                    {/* ═══ HEADER ═══ */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 border-b-4 border-black bg-slate-400"
                    >
                        <div
                            className="w-10 h-10 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center justify-center text-white text-lg flex-shrink-0 rounded-none"
                            style={{ background: color }}
                        >
                            {icon}
                        </div>
                        <h2 className="text-[15px] font-bold flex-1" style={{ color: '#2C2C2C' }}>
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center text-white font-bold bg-red-500 border-2 border-black shadow-[4px_4px_0_0_#000] hover:bg-red-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-none transition-none"
                        >
                            ✕
                        </button>
                    </div>

                    {/* ═══ BODY ═══ */}
                    <div className="px-5 py-4 overflow-y-auto flex-1">
                        {children}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes panelIn {
                    from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `}</style>
        </div>
    );
};

// ═══════════════════════════════════════
// Reusable Sub-Components for Panels
// ═══════════════════════════════════════

/** Metric row: label + value with optional bar */
export function MetricRow({ label, value, max, color = '#4A90E2', icon, suffix = '' }: {
    label: string; value: number; max?: number; color?: string; icon?: string; suffix?: string;
}) {
    const displayValue = `${Math.floor(value).toLocaleString()}${suffix}`;
    const pct = max ? Math.min((value / max) * 100, 100) : null;

    return (
        <div className="flex items-center gap-3 py-2">
            {icon && <span className="text-lg w-6 text-center">{icon}</span>}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] font-semibold" style={{ color: '#555' }}>{label}</span>
                    <span className="text-[13px] font-bold font-mono" style={{ color: value === 0 ? '#7ED321' : '#2C2C2C' }}>
                        {displayValue}
                    </span>
                </div>
                {pct !== null && (
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: color }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

/** Section header inside panels */
export function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-4">
            <div
                className="text-[10px] font-bold uppercase tracking-wider mb-2 pb-1"
                style={{ color: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
            >
                {title}
            </div>
            {children}
        </div>
    );
}

/** Warning/Alert badge */
export function PanelAlert({ type, message }: { type: 'warning' | 'danger' | 'ok'; message: string }) {
    const styles = {
        warning: { bg: 'rgba(245,166,35,0.12)', color: '#F5A623', icon: '⚠️' },
        danger: { bg: 'rgba(208,2,27,0.12)', color: '#D0021B', icon: '🚨' },
        ok: { bg: 'rgba(126,211,33,0.12)', color: '#7ED321', icon: '✅' },
    };
    const s = styles[type];

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2" style={{ background: s.bg }}>
            <span className="text-sm">{s.icon}</span>
            <span className="text-[11px] font-semibold" style={{ color: s.color }}>{message}</span>
        </div>
    );
}

/** Coverage map button */
export function CoverageButton({ label, onClick }: { label: string; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(74,144,226,0.1)', color: '#4A90E2', border: '1px solid rgba(74,144,226,0.2)' }}
        >
            🗺️ {label}
        </button>
    );
}
