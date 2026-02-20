'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Viewport } from 'pixi-viewport';
import { ChunkManager } from '../../engine/ChunkManager';
import { getGameEngine } from '../../engine/GameEngine';
import { formatNumber } from '../ui/GameWidgets';

interface ExpandableChunk {
    cx: number;
    cy: number;
    cost: number;
    pixelX: number;
    pixelY: number;
}

interface Props {
    viewportRef: React.MutableRefObject<Viewport | null>;
    isReady: boolean;
}

/**
 * ChunkExpandOverlay — Boutons '+' flottants au-dessus des chunks achetables
 * Convertit les coordonnées monde → pixel écran via le viewport PixiJS
 */
export default function ChunkExpandOverlay({ viewportRef, isReady }: Props) {
    const [chunks, setChunks] = useState<ExpandableChunk[]>([]);

    const updatePositions = useCallback(() => {
        const vp = viewportRef.current;
        if (!vp) return;

        const expandable = ChunkManager.getExpandableChunks();
        const result: ExpandableChunk[] = [];

        for (const chunk of expandable) {
            // Convertir coordonnées monde → écran via toScreen()
            const screen = vp.toScreen(chunk.worldX, chunk.worldY);
            result.push({
                cx: chunk.cx,
                cy: chunk.cy,
                cost: chunk.cost,
                pixelX: screen.x,
                pixelY: screen.y,
            });
        }

        setChunks(result);
    }, [viewportRef]);

    useEffect(() => {
        if (!isReady || !viewportRef.current) return;

        // Mise à jour sur chaque frame via le ticker du viewport
        const vp = viewportRef.current;
        const onMoved = () => updatePositions();
        const onZoomed = () => updatePositions();

        vp.on('moved', onMoved);
        vp.on('zoomed', onZoomed);

        // Mise à jour initiale
        updatePositions();

        return () => {
            vp.off('moved', onMoved);
            vp.off('zoomed', onZoomed);
        };
    }, [isReady, viewportRef, updatePositions]);

    const handleExpand = (cx: number, cy: number, cost: number) => {
        const engine = getGameEngine();
        if (engine.map.resources.money >= cost) {
            engine.map.resources.money -= cost;
            ChunkManager.unlockChunk(cx, cy);
            engine.map.revision++;
            updatePositions(); // Refresh les positions
        } else {
            console.warn(`💰 Pas assez d'argent ! (${formatNumber(engine.map.resources.money)} / ${formatNumber(cost)})`);
        }
    };

    if (chunks.length === 0) return null;

    return (
        <>
            {chunks.map(chunk => (
                <button
                    key={`expand_${chunk.cx}_${chunk.cy}`}
                    onClick={() => handleExpand(chunk.cx, chunk.cy, chunk.cost)}
                    style={{
                        position: 'absolute',
                        left: chunk.pixelX,
                        top: chunk.pixelY,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                        background: 'rgba(0, 207, 255, 0.15)',
                        backdropFilter: 'blur(8px)',
                        border: '2px solid rgba(0, 207, 255, 0.6)',
                        borderRadius: '12px',
                        padding: '8px 14px',
                        color: '#00CFFF',
                        fontWeight: 700,
                        fontSize: '13px',
                        fontFamily: "'Inter', sans-serif",
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 0 20px rgba(0, 207, 255, 0.2), inset 0 0 10px rgba(0, 207, 255, 0.1)',
                        zIndex: 50,
                        whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 207, 255, 0.3)';
                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 207, 255, 0.4), inset 0 0 15px rgba(0, 207, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 207, 255, 0.15)';
                        e.currentTarget.style.transform = 'translate(-50%, -50%)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 207, 255, 0.2), inset 0 0 10px rgba(0, 207, 255, 0.1)';
                    }}
                >
                    + ${formatNumber(chunk.cost)}
                </button>
            ))}
        </>
    );
}
