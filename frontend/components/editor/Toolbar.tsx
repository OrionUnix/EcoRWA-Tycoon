'use client';

import React from 'react';

interface ToolbarProps {
    selectedTool: string | null;
    setSelectedTool: (tool: string | null) => void;
}

export default function Toolbar({ selectedTool, setSelectedTool }: ToolbarProps) {
    // Chemin vers tes icônes
    const iconPath = "/assets/models/UI/PNG";

    const tools = [
        { id: 'ROAD', icon: `${iconPath}/road.png`, label: 'Routes' },
        { id: 'DELETE', icon: `${iconPath}/tool_bomb.png`, label: 'Démolir' },
        { id: 'ENERGY', icon: `${iconPath}/gear.png`, label: 'Énergie' }, // Futur usage RWA
        { id: 'VIEW', icon: `${iconPath}/larger.png`, label: 'Vue' },
        { id: 'RES', icon: `${iconPath}/home.png`, label: 'Habitation' },
{ id: 'COM', icon: `${iconPath}/shoppingCart.png`, label: 'Commerce' },
{ id: 'IND', icon: `${iconPath}/industrial.png`, label: 'Industrie' },
    ];

    return (
        <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderRadius: '16px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                    style={{
                        width: '56px',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        backgroundColor: selectedTool === tool.id ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                        transform: selectedTool === tool.id ? 'translateY(-10px) scale(1.1)' : 'none',
                        boxShadow: selectedTool === tool.id ? '0 10px 20px rgba(59, 130, 246, 0.4)' : 'none',
                    }}
                    title={tool.label}
                >
                    <img 
                        src={tool.icon} 
                        alt={tool.label} 
                        style={{ 
                            width: '32px', 
                            height: '32px', 
                            filter: selectedTool === tool.id ? 'brightness(2)' : 'brightness(1.5)' 
                        }} 
                    />
                </button>
            ))}

            {/* Séparateur et Mode Actuel */}
            <div style={{
                height: '40px',
                width: '2px',
                background: 'rgba(255,255,255,0.1)',
                margin: '0 10px'
            }} />

            <div style={{
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                minWidth: '100px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>
                {selectedTool ? selectedTool : 'Exploration'}
            </div>
        </div>
    );
}