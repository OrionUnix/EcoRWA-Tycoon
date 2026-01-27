'use client';
import React from 'react';

// --- STYLES (Définis en haut pour être sûr qu'ils soient chargés) ---
const containerStyle: React.CSSProperties = { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' };
const mainBarStyles: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', background: 'rgba(15, 23, 42, 0.95)', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' };
const toolButtonStyle: React.CSSProperties = { width: '52px', height: '52px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', borderRadius: '12px' };
const subMenuStyles: React.CSSProperties = { display: 'flex', gap: '8px', padding: '10px', background: 'rgba(30, 41, 59, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' };
const subBtnStyle: React.CSSProperties = { border: 'none', color: 'white', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px', transition: 'all 0.2s' };
const dividerStyle: React.CSSProperties = { height: '30px', width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 5px' };

interface ToolbarProps {
    selectedTool: string | null;
    setSelectedTool: (tool: string | null) => void;
    isNight: boolean;
    setIsNight: (v: boolean) => void;
}

const NATURE_ITEMS = [
    { id: 'tree_oak_dark', label: 'Chêne', icon: '🌳' },
    { id: 'tree_palm', label: 'Palmier', icon: '🌴' },
    { id: 'rock_tallA', label: 'Rocher', icon: '🪨' },
    { id: 'ground_grass', label: 'Herbe', icon: '🌱' }, // Ton nouveau modèle
];

const ZONE_ITEMS = [
    { id: 'RES', label: 'Habit.', icon: '🏠' },
    { id: 'COM', label: 'Comm.', icon: '🏢' },
    { id: 'IND', label: 'Indus.', icon: '🏭' },
];

export default function Toolbar({ selectedTool, setSelectedTool, isNight, setIsNight }: ToolbarProps) {
    const iconPath = "/assets/models/UI/PNG";
    
    // Outils principaux
    const mainTools = [
        { id: 'ROAD', icon: `${iconPath}/road.png`, label: 'Routes' },
        { id: 'WATER', icon: `${iconPath}/walter.png`, label: 'Rivières' },
        { id: 'ZONES', icon: `${iconPath}/menuGrid.png`, label: 'Zones' },
        { id: 'NATURE', icon: `${iconPath}/resource_wheat.png`, label: 'Nature' },
        { id: 'DELETE', icon: `${iconPath}/tool_bomb.png`, label: 'Démolir' },
    ];

    const isNatureActive = selectedTool?.startsWith('NATURE');
    const isZoneActive = ['RES', 'COM', 'IND'].includes(selectedTool || '');

    return (
        <div style={containerStyle}>
            {/* SOUS-MENU NATURE */}
            {selectedTool === 'NATURE' || isNatureActive ? (
                <div style={subMenuStyles}>
                    {NATURE_ITEMS.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => setSelectedTool(`NATURE:${item.id}`)}
                            style={{
                                ...subBtnStyle,
                                backgroundColor: selectedTool === `NATURE:${item.id}` ? '#3b82f6' : 'rgba(255,255,255,0.05)'
                            }}
                        >
                            <span style={{fontSize: '20px'}}>{item.icon}</span>
                            <span style={{fontSize: '10px', marginTop: '4px'}}>{item.label}</span>
                        </button>
                    ))}
                </div>
            ) : null}

            {/* SOUS-MENU ZONES */}
            {selectedTool === 'ZONES' || isZoneActive ? (
                <div style={subMenuStyles}>
                    {ZONE_ITEMS.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => setSelectedTool(item.id)}
                            style={{
                                ...subBtnStyle,
                                backgroundColor: selectedTool === item.id ? '#3b82f6' : 'rgba(255,255,255,0.05)'
                            }}
                        >
                            <span style={{fontSize: '20px'}}>{item.icon}</span>
                            <span style={{fontSize: '10px', marginTop: '4px'}}>{item.label}</span>
                        </button>
                    ))}
                </div>
            ) : null}

            {/* BARRE PRINCIPALE */}
            <div style={mainBarStyles}>
                {mainTools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                        style={{
                            ...toolButtonStyle,
                            backgroundColor: (selectedTool === tool.id || 
                                             (tool.id === 'NATURE' && isNatureActive) || 
                                             (tool.id === 'ZONES' && isZoneActive)) ? '#3b82f6' : 'transparent',
                        }}
                    >
                        <img src={tool.icon} style={{ width: '28px', height: '28px' }} alt={tool.label} />
                    </button>
                ))}

                <div style={dividerStyle} />

                {/* BOUTON JOUR/NUIT */}
                <button
                    onClick={() => setIsNight(!isNight)}
                    style={{
                        ...toolButtonStyle,
                        backgroundColor: isNight ? '#1e293b' : '#f59e0b',
                        boxShadow: isNight ? 'inset 0 0 10px rgba(0,0,0,0.5)' : '0 0 15px rgba(245, 158, 11, 0.4)',
                    }}
                >
                    <span style={{ fontSize: '20px' }}>{isNight ? '🌙' : '☀️'}</span>
                </button>
            </div>
        </div>
    );
}