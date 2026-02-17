import React from 'react';
import { BuildingData, BUILDING_SPECS, BuildingType } from '../../engine/types';
import { BuildingManager } from '../../engine/BuildingManager';
import { formatNumber } from './GameWidgets'; // Correct import path
import { MapEngine } from '../../engine/MapEngine';

interface BuildingInspectorProps {
    engine: MapEngine;
    building: BuildingData;
    index: number;
    onClose: () => void;
    onUpgrade: () => void;
}

export const BuildingInspector: React.FC<BuildingInspectorProps> = ({ engine, building, index, onClose, onUpgrade }) => {
    const specs = BUILDING_SPECS[building.type];
    const maxLevel = specs.maxLevel || 1;
    const isMaxLevel = building.level >= maxLevel;

    // Calcul du coût : upgradeCost * level actuel
    const upgradeCost = (specs.upgradeCost || 0) * building.level;
    const canAfford = engine.resources.money >= upgradeCost;

    const handleUpgrade = () => {
        if (!canAfford || isMaxLevel) return;

        const result = BuildingManager.upgradeBuilding(engine, index);
        if (result.success) {
            onUpgrade(); // Rafraîchir l'UI
        }
    };

    return (
        <div className="absolute right-4 top-20 w-80 bg-gray-900/95 border border-white/20 p-4 rounded-lg shadow-2xl backdrop-blur-md text-white z-50 animate-in slide-in-from-right-10 duration-200">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-xl text-blue-400">{specs.name}</h3>
                    <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                        Niveau {building.level} / {maxLevel}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Stats */}
            <div className="bg-black/30 p-3 rounded mb-4 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-400">Production</span>
                    <span className="font-mono text-green-400 font-bold">
                        {specs.production ? `${specs.production.amount * (building.level || 1)} / tick` : 'N/A'}
                    </span>
                </div>
                {specs.workersNeeded && (
                    <div className="flex justify-between">
                        <span className="text-gray-400">Travailleurs</span>
                        <span className="font-mono">
                            {specs.workersNeeded * (building.level || 1)}
                        </span>
                    </div>
                )}
                {building.activeContracts && building.activeContracts.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="text-xs text-orange-400 mb-1">Contrats Commerciaux</div>
                        {building.activeContracts.map((c, i) => (
                            <div key={i} className="flex justify-between text-xs">
                                <span>Export {c.resource}</span>
                                <span>{c.amountPerTick}/t @ {c.pricePerUnit}$</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upgrade Button */}
            {specs.upgradeCost && !isMaxLevel ? (
                <button
                    onClick={handleUpgrade}
                    disabled={!canAfford}
                    className={`w-full py-3 px-4 rounded font-bold flex justify-between items-center transition-all
                        ${canAfford
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/20'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    <span>Améliorer</span>
                    <span className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                        {canAfford ? '💰' : '🚫'} {formatNumber(upgradeCost)}$
                    </span>
                </button>
            ) : (
                <div className="w-full py-3 px-4 rounded bg-gray-800 text-gray-500 text-center font-bold border border-white/5">
                    {isMaxLevel ? "Niveau Maximum" : "Pas d'amélioration"}
                </div>
            )}

            {/* Description */}
            <p className="text-xs text-gray-500 mt-4 italic text-center">
                Augmente la production et la capacité.
            </p>
        </div>
    );
};
