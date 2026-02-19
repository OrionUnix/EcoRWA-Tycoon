import React, { useState } from 'react';
import { GlassPanel } from './GlassPanel';

// ═══════════════════════════════════════
// SimCity 2013 — DATA LAYERS PANEL
// Opens from the "Données" toolbar button
// Shows all available data overlays
// ═══════════════════════════════════════

interface DataLayersPanelProps {
    activeLayer: string | null;
    onSelectLayer: (layer: string | null) => void;
    onClose: () => void;
}

const DATA_LAYERS = [
    { id: 'water', icon: '💧', label: "Réseau d'Eau", color: '#50E3C2', group: 'Réseaux' },
    { id: 'power', icon: '⚡', label: 'Réseau Électrique', color: '#F8E71C', group: 'Réseaux' },
    { id: 'sewage', icon: '🚰', label: 'Assainissement', color: '#BD10E0', group: 'Réseaux' },
    { id: 'pollution', icon: '☁️', label: 'Pollution', color: '#F5A623', group: 'Environnement' },
    { id: 'traffic', icon: '🚦', label: 'Trafic', color: '#D0021B', group: 'Environnement' },
    { id: 'landvalue', icon: '💰', label: 'Valeur Foncière', color: '#7ED321', group: 'Économie' },
    { id: 'happiness', icon: '😊', label: 'Bonheur', color: '#F5A623', group: 'Économie' },
    { id: 'jobs', icon: '💼', label: 'Emplois', color: '#4A90E2', group: 'Économie' },
    { id: 'rwa', icon: '🌍', label: 'Économie RWA', color: '#BD10E0', group: 'Économie' },
    { id: 'coal', icon: '⚫', label: 'Charbon', color: '#424242', group: 'Ressources du Sol' },
    { id: 'iron', icon: '🔩', label: 'Fer', color: '#E65100', group: 'Ressources du Sol' },
    { id: 'minerals', icon: '⛏️', label: 'Minerai', color: '#607D8B', group: 'Ressources du Sol' },
    { id: 'oil', icon: '🛢️', label: 'Pétrole', color: '#4A4A4A', group: 'Ressources du Sol' },
    { id: 'gold', icon: '🪙', label: 'Or', color: '#FFD600', group: 'Ressources du Sol' },
    { id: 'silver', icon: '🥈', label: 'Argent', color: '#90A4AE', group: 'Ressources du Sol' },
    { id: 'wildlife', icon: '🦌', label: 'Gibier', color: '#795548', group: 'Ressources du Sol' },
    { id: 'forest', icon: '🌲', label: 'Bois', color: '#7ED321', group: 'Ressources du Sol' },
    { id: 'groundwater', icon: '🌊', label: 'Eau Souterraine', color: '#4A90E2', group: 'Ressources du Sol' },
];

function LayerButton({ layer, active, onClick }: { layer: typeof DATA_LAYERS[0]; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl transition-all duration-150 hover:scale-[1.02]"
            style={{
                background: active ? `${layer.color}15` : 'transparent',
                border: active ? `2px solid ${layer.color}50` : '2px solid transparent',
            }}
        >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-sm flex-shrink-0"
                style={{ background: active ? layer.color : `${layer.color}99` }}>
                {layer.icon}
            </div>
            <span className="text-[11px] font-semibold" style={{ color: active ? '#2C2C2C' : '#666' }}>
                {layer.label}
            </span>
            {active && <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${layer.color}20`, color: layer.color }}>ACTIF</span>}
        </button>
    );
}

export const DataLayersPanel: React.FC<DataLayersPanelProps> = ({ activeLayer, onSelectLayer, onClose }) => {
    // Group layers
    const groups = DATA_LAYERS.reduce((acc, layer) => {
        if (!acc[layer.group]) acc[layer.group] = [];
        acc[layer.group].push(layer);
        return acc;
    }, {} as Record<string, typeof DATA_LAYERS>);

    return (
        <div
            className="fixed z-40 pointer-events-auto"
            style={{
                left: '60px',
                top: '50%',
                transform: 'translateY(-50%)',
                maxHeight: 'calc(100vh - 200px)',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                animation: 'slideIn 0.2s ease-out',
            }}
        >
            <GlassPanel variant="sub" className="p-4">
                <div style={{ width: '260px' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-md"
                                style={{ background: '#4A4A4A' }}>📊</div>
                            <span className="text-[13px] font-bold" style={{ color: '#2C2C2C' }}>Couches de Données</span>
                        </div>
                        <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                            style={{ background: 'rgba(0,0,0,0.06)', color: '#999' }}>✕</button>
                    </div>

                    {/* Clear button */}
                    {activeLayer && (
                        <button
                            onClick={() => onSelectLayer(null)}
                            className="w-full mb-3 py-2 rounded-xl text-[11px] font-bold transition-all hover:scale-[1.02]"
                            style={{ background: 'rgba(208,2,27,0.08)', color: '#D0021B', border: '1px solid rgba(208,2,27,0.15)' }}
                        >
                            ✕ Désactiver la couche active
                        </button>
                    )}

                    {/* Grouped layers */}
                    <div className="overflow-y-auto space-y-3" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                        {Object.entries(groups).map(([groupName, layers]) => (
                            <div key={groupName}>
                                <div className="text-[9px] font-bold uppercase tracking-wider mb-1 px-1" style={{ color: 'rgba(0,0,0,0.3)' }}>
                                    {groupName}
                                </div>
                                <div className="space-y-0.5">
                                    {layers.map(layer => (
                                        <LayerButton
                                            key={layer.id}
                                            layer={layer}
                                            active={activeLayer === layer.id}
                                            onClick={() => onSelectLayer(activeLayer === layer.id ? null : layer.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassPanel>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translate(-12px, -50%); }
                    to { opacity: 1; transform: translate(0, -50%); }
                }
            `}</style>
        </div>
    );
};
