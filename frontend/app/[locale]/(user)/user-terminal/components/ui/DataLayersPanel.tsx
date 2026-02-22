import React from 'react';

// ═══════════════════════════════════════
// SimCity 2013 — DATA LAYERS PANEL
// Wired to viewMode for real map overlay rendering
// 2 Sections: Simulation + Natural Resources
// ═══════════════════════════════════════

interface DataLayersPanelProps {
    activeLayer: string | null;
    onSelectLayer: (layer: string | null) => void;
    onSetViewMode: (mode: string) => void;
    onClose: () => void;
}

// Each layer maps to a viewMode string used by TerrainRenderer.drawOverlays
interface DataLayer {
    id: string;
    viewMode: string; // The actual viewMode sent to the engine
    icon: string;
    label: string;
    color: string;
    group: string;
}

const DATA_LAYERS: DataLayer[] = [
    // ── Section 1: Simulation Layers (SimCity 2013) ──
    { id: 'water_net', viewMode: 'WATER_NET', icon: '💧', label: "Réseau d'Eau", color: '#50E3C2', group: '🏙️ Indicateurs Ville' },
    { id: 'power_net', viewMode: 'POWER_NET', icon: '⚡', label: 'Réseau Électrique', color: '#F8E71C', group: '🏙️ Indicateurs Ville' },
    { id: 'sewage', viewMode: 'SEWAGE', icon: '🚰', label: 'Assainissement', color: '#BD10E0', group: '🏙️ Indicateurs Ville' },
    { id: 'pollution', viewMode: 'POLLUTION', icon: '☁️', label: 'Pollution', color: '#F5A623', group: '🏙️ Indicateurs Ville' },
    { id: 'traffic', viewMode: 'TRAFFIC', icon: '🚦', label: 'Trafic', color: '#D0021B', group: '🏙️ Indicateurs Ville' },
    { id: 'landvalue', viewMode: 'LAND_VALUE', icon: '💰', label: 'Valeur Foncière', color: '#7ED321', group: '🏙️ Indicateurs Ville' },
    { id: 'happiness', viewMode: 'HAPPINESS', icon: '😊', label: 'Bonheur', color: '#7ED321', group: '🏙️ Indicateurs Ville' },
    { id: 'jobs', viewMode: 'JOBS', icon: '💼', label: 'Emplois', color: '#4A90E2', group: '🏙️ Indicateurs Ville' },
    { id: 'rwa', viewMode: 'RWA_ECONOMY', icon: '🌍', label: 'Économie RWA', color: '#BD10E0', group: '🏙️ Indicateurs Ville' },

    // ── Section 2: Natural Resources ──
    { id: 'coal', viewMode: 'COAL', icon: '⚫', label: 'Charbon', color: '#424242', group: '🌍 Ressources Naturelles' },
    { id: 'iron', viewMode: 'IRON', icon: '⛏️', label: 'Minerai', color: '#E65100', group: '🌍 Ressources Naturelles' },
    { id: 'stone', viewMode: 'STONE', icon: '🪨', label: 'Pierre', color: '#808080', group: '🌍 Ressources Naturelles' },
    { id: 'oil', viewMode: 'OIL', icon: '🛢️', label: 'Pétrole', color: '#4A4A4A', group: '🌍 Ressources Naturelles' },
    { id: 'gold', viewMode: 'GOLD', icon: '🪙', label: 'Or', color: '#FFD600', group: '🌍 Ressources Naturelles' },
    { id: 'silver', viewMode: 'SILVER', icon: '🥈', label: 'Argent', color: '#90A4AE', group: '🌍 Ressources Naturelles' },
    { id: 'wood', viewMode: 'WOOD', icon: '🌲', label: 'Bois', color: '#7ED321', group: '🌍 Ressources Naturelles' },
    { id: 'wildlife', viewMode: 'ANIMALS', icon: '🦌', label: 'Gibier', color: '#795548', group: '🌍 Ressources Naturelles' },
    { id: 'groundwater', viewMode: 'WATER_LAYER', icon: '🌊', label: 'Eau Souterraine', color: '#4A90E2', group: '🌍 Ressources Naturelles' },
];

function LayerButton({ layer, active, onClick }: { layer: DataLayer; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 rounded-xl transition-all duration-150 hover:bg-white/5 hover:scale-[1.01]"
            style={{
                background: active ? `${layer.color}25` : 'transparent',
                border: active ? `1.5px solid ${layer.color}80` : '1.5px solid transparent',
            }}
        >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-sm flex-shrink-0"
                style={{ background: active ? layer.color : `${layer.color}66` }}>
                {layer.icon}
            </div>
            <span className="text-[11px] font-semibold" style={{ color: active ? 'white' : '#aaa' }}>
                {layer.label}
            </span>
            {active && (
                <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${layer.color}20`, color: layer.color }}>
                    ACTIF
                </span>
            )}
        </button>
    );
}

export const DataLayersPanel: React.FC<DataLayersPanelProps> = ({ activeLayer, onSelectLayer, onSetViewMode, onClose }) => {
    // Group layers
    const groups = DATA_LAYERS.reduce((acc, layer) => {
        if (!acc[layer.group]) acc[layer.group] = [];
        acc[layer.group].push(layer);
        return acc;
    }, {} as Record<string, DataLayer[]>);

    const handleSelectLayer = (layer: DataLayer) => {
        if (activeLayer === layer.id) {
            // Deselect → return to normal view
            onSelectLayer(null);
            onSetViewMode('ALL');
        } else {
            // Select → activate overlay
            onSelectLayer(layer.id);
            onSetViewMode(layer.viewMode);
        }
    };

    const handleClose = () => {
        // Reset viewMode when closing
        onSelectLayer(null);
        onSetViewMode('ALL');
        onClose();
    };

    const handleClear = () => {
        onSelectLayer(null);
        onSetViewMode('ALL');
    };

    return (
        <div
            className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 max-h-[60vh] overflow-y-auto bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-xl p-4 shadow-2xl origin-bottom animate-in fade-in slide-in-from-bottom-2 z-40 pointer-events-auto"
            style={{
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
        >
            <div className="w-full flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shadow-md"
                            style={{ background: '#4A4A4A' }}>📊</div>
                        <span className="text-[12px] font-bold text-white">Couches de Données</span>
                    </div>
                    <button onClick={handleClose} className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] hover:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc' }}>✕</button>
                </div>

                {/* Clear button */}
                {activeLayer && (
                    <button
                        onClick={handleClear}
                        className="w-full mb-2 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:scale-[1.01]"
                        style={{ background: 'rgba(208,2,27,0.08)', color: '#D0021B', border: '1px solid rgba(208,2,27,0.15)' }}
                    >
                        ✕ Désactiver
                    </button>
                )}

                {/* Grouped layers */}
                <div className="overflow-y-auto space-y-2">
                    {Object.entries(groups).map(([groupName, layers]) => (
                        <div key={groupName}>
                            <div className="text-sm font-bold text-slate-400 uppercase mt-4 mb-2 border-b border-slate-600 pb-1">
                                {groupName}
                            </div>
                            <div className="space-y-0.5">
                                {layers.map(layer => (
                                    <LayerButton
                                        key={layer.id}
                                        layer={layer}
                                        active={activeLayer === layer.id}
                                        onClick={() => handleSelectLayer(layer)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div >
    );
};
