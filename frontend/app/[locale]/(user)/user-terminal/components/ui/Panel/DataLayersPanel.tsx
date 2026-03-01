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
            className={`flex items-center gap-2.5 w-full px-3 py-1.5 rounded-none border-2 active:border-black active:border-b-white active:border-r-white active:bg-[#a9afb5] ${active
                    ? 'border-black border-b-white border-r-white bg-[#a9afb5]'
                    : 'border-white border-b-black border-r-black bg-[#c3c7cb]'
                }`}
        >
            <div className="w-7 h-7 flex items-center justify-center text-black text-xs flex-shrink-0"
                style={{ imageRendering: 'pixelated' }}>
                {layer.icon}
            </div>
            <span className="text-[11px] font-bold text-black">
                {layer.label}
            </span>
            {active && (
                <span className="ml-auto text-[8px] font-black px-1.5 py-0.5 border border-black bg-white text-black">
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

    // Couches qui correspondent à des ressources souterraines affichées par RawResourceIconRenderer
    const RAW_RESOURCE_LAYERS = new Set(['coal', 'iron', 'stone', 'oil', 'gold', 'silver', 'groundwater']);

    const handleSelectLayer = (layer: DataLayer) => {
        if (activeLayer === layer.id) {
            // Désélection → retour vue normale
            onSelectLayer(null);
            onSetViewMode('ALL');
            // Cacher les icônes de ressources
            window.dispatchEvent(new CustomEvent('set_resource_layer', { detail: null }));
        } else {
            // Sélection → activer l'overlay
            onSelectLayer(layer.id);
            onSetViewMode(layer.viewMode);
            // Activer les icônes si c'est une ressource souterraine
            const resKey = RAW_RESOURCE_LAYERS.has(layer.id)
                ? layer.id.toUpperCase().replace('GROUNDWATER', 'WATER')
                : null;
            window.dispatchEvent(new CustomEvent('set_resource_layer', { detail: resKey }));
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
            className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 max-h-[60vh] overflow-y-auto bg-[#c3c7cb] border-4 border-black rounded-none p-4 shadow-[4px_4px_0_0_#000] z-40 pointer-events-auto"
            style={{
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
        >
            <div className="w-full flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-black">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 flex items-center justify-center text-black text-xs"
                            style={{ imageRendering: 'pixelated' }}>📊</div>
                        <span className="text-[12px] font-black text-black uppercase">Couches de Données</span>
                    </div>
                    <button onClick={handleClose} className="w-5 h-5 flex items-center justify-center text-[10px] font-bold border border-black bg-[#c3c7cb] hover:bg-[#a9afb5]">✕</button>
                </div>

                {/* Clear button */}
                {activeLayer && (
                    <button
                        onClick={handleClear}
                        className="w-full mb-4 py-1.5 rounded-none border-2 border-white border-b-black border-r-black bg-[#c3c7cb] text-[10px] font-black uppercase text-[#D0021B] hover:bg-[#a9afb5] active:border-black active:border-b-white active:border-r-white"
                    >
                        ✕ Désactiver l'affichage
                    </button>
                )}

                {/* Grouped layers */}
                <div className="overflow-y-auto space-y-2">
                    {Object.entries(groups).map(([groupName, layers]) => (
                        <div key={groupName}>
                            <div className="text-[10px] font-black text-black uppercase mt-4 mb-2 border-b-2 border-black pb-0.5">
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
