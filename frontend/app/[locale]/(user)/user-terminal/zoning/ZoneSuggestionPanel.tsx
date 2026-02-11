import React from 'react';
import { ZoneSuggestion } from '../zoning/AutoZoneDetector';
import { ZoneType } from '../engine/types';

interface ZoneSuggestionPanelProps {
    suggestions: ZoneSuggestion[];
    onAccept: () => void;
    onCancel: () => void;
}

/**
 * Panel d'interface pour valider ou annuler les suggestions de zones
 */
export default function ZoneSuggestionPanel({ suggestions, onAccept, onCancel }: ZoneSuggestionPanelProps) {
    // Compter les zones par type
    const counts = suggestions.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
    }, {} as Record<ZoneType, number>);

    const residential = counts[ZoneType.RESIDENTIAL] || 0;
    const commercial = counts[ZoneType.COMMERCIAL] || 0;
    const industrial = counts[ZoneType.INDUSTRIAL] || 0;

    return (
        <div style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid #FFD700',
            borderRadius: '12px',
            padding: '20px',
            zIndex: 1000,
            minWidth: '350px',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)'
        }}>
            <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '12px',
                textAlign: 'center',
                color: '#FFD700'
            }}>
                🏗️ Zones proposées ({suggestions.length} cases)
            </div>

            <div style={{ marginBottom: '16px', fontSize: '14px' }}>
                {residential > 0 && (
                    <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: '#4CAF50' }}>●</span> <b>{residential}</b> Résidentielle{residential > 1 ? 's' : ''}
                    </div>
                )}
                {commercial > 0 && (
                    <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: '#2196F3' }}>●</span> <b>{commercial}</b> Commerciale{commercial > 1 ? 's' : ''}
                    </div>
                )}
                {industrial > 0 && (
                    <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: '#FFC107' }}>●</span> <b>{industrial}</b> Industrielle{industrial > 1 ? 's' : ''}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                    onClick={onAccept}
                    style={{
                        padding: '10px 20px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#45a049'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
                >
                    ✅ Valider tout
                </button>

                <button
                    onClick={onCancel}
                    style={{
                        padding: '10px 20px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#da190b'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f44336'}
                >
                    ❌ Annuler
                </button>
            </div>

            <div style={{
                marginTop: '12px',
                fontSize: '11px',
                color: '#999',
                textAlign: 'center'
            }}>
                Les zones seront placées à côté des routes
            </div>
        </div>
    );
}
