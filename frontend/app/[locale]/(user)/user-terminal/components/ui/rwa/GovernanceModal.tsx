import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedAvatar } from '../../AnimatedAvatar';
import { TypewriterText } from '../../TypewriterText';
import { useTranslations } from 'next-intl';
import { getAssetDetails } from '../../../hooks/useRWAInventory';

interface Props {
    govTargetItem: any;
    voteSuccess: boolean;
    isTypingGov: boolean;
    showGovDetails: boolean;
    onVote: (choice: string) => void;
    onShowDetails: (show: boolean) => void;
    onTypingFinished: () => void;
}

export const GovernanceModal: React.FC<Props> = ({
    govTargetItem, voteSuccess, isTypingGov, showGovDetails,
    onVote, onShowDetails, onTypingFinished,
}) => {
    const tInv = useTranslations('inventory');
    const tJordan = useTranslations('jordan');
    const details = getAssetDetails(govTargetItem.id);

    return (
        <motion.div
            key="gov-modal"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pointer-events-auto"
        >
            <div className={`bg-[#1e293b] border-2 w-full max-w-2xl rounded-xl shadow-2xl text-white p-6 relative ${voteSuccess ? 'border-emerald-500' : 'border-purple-500'}`}>
                <div className="flex flex-col sm:flex-row gap-4 items-start relative">
                    <div className={`absolute top-0 left-0 w-1 h-full ${voteSuccess ? 'bg-emerald-500' : 'bg-purple-500'}`} />
                    <div className="flex-shrink-0 mt-1 pl-2">
                        <AnimatedAvatar character="jordan" isTalking={isTypingGov} />
                    </div>
                    <div className="flex-1 w-full">
                        <div className={`font-black tracking-widest uppercase text-xs mb-2 border-b border-gray-700 pb-1 ${voteSuccess ? 'text-emerald-400' : 'text-purple-400'}`}>
                            {tInv('gov_title')} - {tJordan(`choices.${details.key}.name`)}
                        </div>

                        <div className="text-white text-sm font-bold min-h-[40px] mb-4">
                            <TypewriterText
                                key={voteSuccess ? `success-${govTargetItem.id}` : `question-${govTargetItem.id}`}
                                text={tInv(`gov_scenarios.${details.key}.${voteSuccess ? 'success' : 'alert'}`)}
                                speed={20}
                                onFinished={onTypingFinished}
                            />
                        </div>

                        {/* Détails oui/non */}
                        <AnimatePresence>
                            {showGovDetails && !voteSuccess && !isTypingGov && (
                                <motion.div
                                    key="gov-details-panel"
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4 text-xs space-y-3 overflow-hidden"
                                >
                                    <div>
                                        <span className="text-emerald-400 font-bold block mb-1">{tInv('impact_yes')}</span>
                                        <p className="text-gray-300">{tInv(`gov_scenarios.${details.key}.details_yes`)}</p>
                                    </div>
                                    <div className="border-t border-gray-700 pt-2">
                                        <span className="text-red-400 font-bold block mb-1">{tInv('impact_no')}</span>
                                        <p className="text-gray-300">{tInv(`gov_scenarios.${details.key}.details_no`)}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Boutons de vote */}
                        {!isTypingGov && !voteSuccess && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 mt-2">
                                {!showGovDetails && (
                                    <button onClick={() => onShowDetails(true)}
                                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded text-xs font-bold uppercase tracking-widest transition-colors">
                                        {tInv('btn_details')}
                                    </button>
                                )}
                                <div className="flex gap-4">
                                    <button onClick={() => { onShowDetails(false); onVote('OUI'); }}
                                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest rounded transition-transform active:scale-95 shadow-[0_4px_0_rgb(126,34,206)]">
                                        {tInv('btn_yes')}
                                    </button>
                                    <button onClick={() => { onShowDetails(false); onVote('NON'); }}
                                        className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-black uppercase tracking-widest rounded transition-transform active:scale-95 shadow-[0_4px_0_rgb(71,85,105)]">
                                        {tInv('btn_no')}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
