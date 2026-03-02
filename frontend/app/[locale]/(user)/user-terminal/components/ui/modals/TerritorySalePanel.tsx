'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedAvatar } from '../npcs/AnimatedAvatar';
import { useTypewriterWithSound } from '../../../hooks/useTypewriterWithSound';
import { useTranslations } from 'next-intl';
import { getMapEngine } from '../../../engine/MapEngine';
import { CHUNK_SIZE, TOTAL_CELLS } from '../../../engine/config';
import { ChunkManager } from '../../../engine/ChunkManager';

interface ChunkCoords {
    cx: number;
    cy: number;
}

interface TerritorySalePanelProps {
    isOpen: boolean;
    chunkData: {
        id: string | number;
        price: number;
        cx: number;
        cy: number;
    } | null;
    onBuy: () => void;
    onCancel: () => void;
    playerFunds: number;
}

/**
 * TerritorySalePanel - Windows 95 / RTS style modal for land expansion
 * Refactored with dynamic resource detection and comparison.
 */
export const TerritorySalePanel: React.FC<TerritorySalePanelProps> = ({
    isOpen,
    chunkData,
    onBuy,
    onCancel,
    playerFunds
}) => {
    const t = useTranslations('territory');
    const engine = getMapEngine();

    const resourceEmojis: Record<string, string> = {
        wood: '🪵', stone: '🪨', coal: '⚫', iron: '⛓️', gold: '💰', silver: '🥈', oil: '🛢️'
    };

    // 1. Logic: Resource Detection and Comparison
    const resourceAnalysis = useMemo(() => {
        if (!chunkData || !isOpen) return null;

        const resources = ['wood', 'stone', 'coal', 'iron', 'gold', 'silver', 'oil'] as const;
        const results: { id: string; name: string; qty: number; comparisonLabel: string, color: string }[] = [];

        // Current Owned Territories Analysis (Average)
        const ownedChunks: ChunkCoords[] = [];
        for (let cy = 0; cy < ChunkManager.unlocked.length; cy++) {
            for (let cx = 0; cx < ChunkManager.unlocked[cy].length; cx++) {
                if (ChunkManager.unlocked[cy][cx]) ownedChunks.push({ cx, cy });
            }
        }

        const getChunkTotal = (cx: number, cy: number, resMap: Float32Array) => {
            let total = 0;
            const startX = cx * CHUNK_SIZE;
            const startY = cy * CHUNK_SIZE;
            const mapSize = Math.sqrt(TOTAL_CELLS);
            for (let y = startY; y < startY + CHUNK_SIZE; y++) {
                for (let x = startX; x < startX + CHUNK_SIZE; x++) {
                    total += resMap[y * mapSize + x] || 0;
                }
            }
            return total;
        };

        resources.forEach(res => {
            const resMap = engine.resourceMaps[res as keyof typeof engine.resourceMaps] as Float32Array;
            if (!resMap) return;

            const newQtyIntensity = getChunkTotal(chunkData.cx, chunkData.cy, resMap);

            let avgOwnedIntensity = 0;
            if (ownedChunks.length > 0) {
                const totalOwnedIntensity = ownedChunks.reduce((sum, c) => sum + getChunkTotal(c.cx, c.cy, resMap), 0);
                avgOwnedIntensity = totalOwnedIntensity / ownedChunks.length;
            }

            if (newQtyIntensity > 0.5) {
                const qtyVal = Math.floor(newQtyIntensity * 1000);
                const isSignificantlyBetter = newQtyIntensity > avgOwnedIntensity * 1.5;
                const isBetter = newQtyIntensity > avgOwnedIntensity;

                let label = '';
                let color = '';
                if (isSignificantlyBetter) {
                    label = t('status.abundant');
                    color = 'text-green-500';
                } else if (isBetter) {
                    label = t('status.more');
                    color = 'text-green-400';
                } else {
                    label = t('status.less');
                    color = 'text-red-400';
                }

                results.push({
                    id: res,
                    name: t(`resources.${res}`),
                    qty: qtyVal,
                    comparisonLabel: label,
                    color: color
                });
            }
        });

        return results;
    }, [chunkData, isOpen, engine, t]);

    // 2. Dynamic Advisor Advice
    const adviceCondition = useMemo(() => {
        if (!isOpen) return 'default';

        // stats extraction - Fix: engine instead of engine.map
        const buildingCount = engine.buildingLayer.filter(b => b !== null).length;
        const roadCount = engine.roadLayer.filter(r => r !== null).length;
        const zoneCount = engine.zoningLayer.filter(z => z !== null).length;
        const totalOccupied = buildingCount + roadCount + zoneCount;

        const unlockedChunksCount = ChunkManager.unlocked.flat().filter(u => u).length;
        const totalTilesAvailable = unlockedChunksCount * CHUNK_SIZE * CHUNK_SIZE;
        const density = totalTilesAvailable > 0 ? totalOccupied / totalTilesAvailable : 0;

        if (buildingCount < 8) return 'early';
        if (chunkData && chunkData.price > playerFunds * 0.7) return 'expensive';
        if (density > 0.3) return 'no_space';
        return 'default';
    }, [engine, chunkData, playerFunds, isOpen]);

    const pitchText = `${t('dialogue')} ${t(`advice.${adviceCondition}`)}`;

    // 3. Typewriter effect
    const { displayedText, isTyping } = useTypewriterWithSound(isOpen ? pitchText : "", 25);

    if (!isOpen || !chunkData) return null;

    const canAfford = playerFunds >= chunkData.price;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 pointer-events-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#c3c7cb] border-4 border-black shadow-[12px_12px_0_0_#000] w-full max-w-[650px] flex flex-col rounded-none relative overflow-hidden"
                        style={{ imageRendering: 'pixelated' }}
                    >
                        {/* WINDOW TITLE BAR */}
                        <div className="bg-[#000080] h-[34px] flex items-center justify-between px-2 shrink-0">
                            <span className="text-white font-bold text-sm tracking-wider uppercase flex items-center gap-2">
                                <span className="mr-1">📜</span> {t('title')}
                            </span>
                            <button
                                onClick={onCancel}
                                className="bg-[#c3c7cb] border-2 border-white border-r-black border-b-black w-6 h-6 flex items-center justify-center font-black text-black hover:bg-red-500 hover:text-white transition-colors text-xs"
                            >
                                ×
                            </button>
                        </div>

                        {/* CONTENT BODY */}
                        <div className="p-6 flex flex-col md:flex-row gap-8">
                            {/* LEFT COLUMN: JORDAN - NO BORDER/CIRCLE/BG */}
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <div className="w-24 h-24 flex items-center justify-center">
                                    <AnimatedAvatar character="jordan" isTalking={isTyping} />
                                </div>
                                <span className="bg-blue-900 text-white text-[11px] px-3 py-1 border-2 border-black font-black uppercase tracking-tighter shadow-[3px_3px_0_0_#000]">
                                    Advisor Jordan
                                </span>
                            </div>

                            {/* RIGHT COLUMN: DIALOGUE & RESOURCES */}
                            <div className="flex-1 flex flex-col justify-start gap-4">
                                <div className="bg-white border-4 border-black p-5 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)] min-h-[140px] flex flex-col gap-4">
                                    <p className="text-slate-900 font-black text-[17px] leading-tight">
                                        💬 {displayedText}
                                    </p>

                                    {/* RESOURCE GRID/LIST */}
                                    {!isTyping && resourceAnalysis && resourceAnalysis.length > 0 && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <span className="text-xs uppercase font-black text-slate-500 tracking-widest border-b-2 border-slate-100 pb-1">
                                                📊 Rapport Géologique
                                            </span>
                                            <div className="grid grid-cols-1 gap-1">
                                                {resourceAnalysis.map(r => (
                                                    <div key={r.id} className="flex items-center gap-2 font-bold text-sm">
                                                        <span className="text-lg">{resourceEmojis[r.id] || '🔹'}</span>
                                                        <span className="text-slate-700 w-20">{r.name} :</span>
                                                        <span className="text-slate-900 font-black">{r.qty.toLocaleString()} t</span>
                                                        <span className={`ml-1 text-[11px] font-black italic uppercase ${r.color}`}>
                                                            ({r.comparisonLabel})
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* PRICE DISPLAY */}
                                <div className="flex items-center justify-between bg-slate-900 border-2 border-black p-3 px-5 shadow-[6px_6px_0_0_#000]">
                                    <span className="text-slate-400 uppercase font-black text-xs tracking-widest">{t('price')}</span>
                                    <span className="text-yellow-400 font-black text-2xl tracking-wide">
                                        ${chunkData.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER ACTIONS */}
                        <div className="p-6 border-t-2 border-slate-400/30 flex justify-end gap-6 bg-slate-400/10">
                            <button
                                onClick={onCancel}
                                className="px-8 py-3 bg-red-600 text-white font-black uppercase text-base border-2 border-black shadow-[6px_6px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-none"
                            >
                                {t('cancel')}
                            </button>

                            <button
                                onClick={onBuy}
                                disabled={!canAfford}
                                className={`px-10 py-3 font-black uppercase text-base border-2 border-black shadow-[6px_6px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-none 
                                    ${canAfford
                                        ? 'bg-green-600 text-white hover:bg-green-500'
                                        : 'bg-slate-500 text-slate-300 cursor-not-allowed shadow-none border-slate-600 translate-y-[2px] translate-x-[2px]'
                                    }`}
                            >
                                {canAfford ? t('buy') : t('insufficient_funds')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
