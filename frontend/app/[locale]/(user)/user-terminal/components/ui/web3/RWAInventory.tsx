'use client';
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRWAInventory } from '../../../hooks/useRWAInventory';
import { InventorySlot } from '../rwa/InventorySlot';
import { BuildingDetailsModal } from '../rwa/BuildingDetailsModal';
import { GovernanceModal } from '../rwa/GovernanceModal';

/**
 * RWAInventory — Conteneur principal
 *
 * Toute la logique est dans useRWAInventory.
 * Ce fichier ne contient QUE la composition de sous-composants.
 * ≤ 60 lignes.
 */
export const RWAInventory: React.FC = () => {
    const {
        inventory, selectedItem, setSelectedItem,
        liveYield, claimStatus, isTypingImpact, setIsTypingImpact,
        showGovernance, govTargetItem, isTypingGov, setIsTypingGov,
        voteSuccess, showGovDetails, setShowGovDetails,
        placedIds,
        handleClaim, handleVote, handleTrade, handlePlaceOnMap,
    } = useRWAInventory();

    return (
        <>
            {/* Barre d'inventaire (bas-droite) */}
            <div className="fixed bottom-20 right-8 z-[100] flex items-end gap-2 pointer-events-auto">
                <AnimatePresence>
                    {inventory.map(item => (
                        <InventorySlot key={item.uniqueKey} item={item} onClick={setSelectedItem} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal de détail du bâtiment sélectionné */}
            <AnimatePresence>
                {selectedItem && (
                    <BuildingDetailsModal
                        item={selectedItem}
                        liveYield={liveYield}
                        claimStatus={claimStatus}
                        placedIds={placedIds}
                        isTypingImpact={isTypingImpact}
                        onClose={() => setSelectedItem(null)}
                        onClaim={handleClaim}
                        onTrade={handleTrade}
                        onPlaceOnMap={handlePlaceOnMap}
                    />
                )}
            </AnimatePresence>

            {/* Modal de gouvernance DAO */}
            <AnimatePresence>
                {showGovernance && govTargetItem && (
                    <GovernanceModal
                        govTargetItem={govTargetItem}
                        voteSuccess={voteSuccess}
                        isTypingGov={isTypingGov}
                        showGovDetails={showGovDetails}
                        onVote={handleVote}
                        onShowDetails={setShowGovDetails}
                    />
                )}
            </AnimatePresence>
        </>
    );
};