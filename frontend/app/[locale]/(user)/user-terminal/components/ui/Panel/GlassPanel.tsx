import React from 'react';

/**
 * SimCity 2013 Glass Panel
 * Light translucent panel with soft shadows and rounded corners.
 * 
 * Variants:
 *  - 'toolbar' : Main bottom toolbar (rgba(245,245,245,0.92))
 *  - 'sub'     : Sub-toolbar (rgba(255,255,255,0.95))
 *  - 'info'    : City info bar (rgba(255,255,255,0.85))
 */

interface GlassPanelProps {
    children: React.ReactNode;
    variant?: 'toolbar' | 'sub' | 'info';
    className?: string;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
    toolbar: {
        background: 'rgba(245, 245, 245, 0.92)',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        borderRadius: '22px',
        backdropFilter: 'blur(12px)',
    },
    sub: {
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        borderRadius: '18px',
        backdropFilter: 'blur(12px)',
    },
    info: {
        background: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(0, 0, 0, 0.10)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        borderRadius: '18px',
        backdropFilter: 'blur(10px)',
    },
};

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, variant = 'toolbar', className = '' }) => {
    return (
        <div style={VARIANT_STYLES[variant]} className={className}>
            {children}
        </div>
    );
};
