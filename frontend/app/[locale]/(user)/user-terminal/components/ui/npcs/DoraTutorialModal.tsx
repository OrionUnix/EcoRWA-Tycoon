'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from './AnimatedAvatar';
import { DoraDialogue } from './DoraDialogue';

interface DoraTutorialModalProps {
    onClose: () => void;
}

export const DoraTutorialModal: React.FC<DoraTutorialModalProps> = ({ onClose }) => {
    const t = useTranslations('doratuto');
    const [isTyping, setIsTyping] = useState(true);
    const [showNextButton, setShowNextButton] = useState(false);

    // Pour l'instant, on n'a qu'une étape, mais c'est prêt pour être étendu.
    const steps = ['step1'];
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const handleDialogueComplete = () => {
        setIsTyping(false);
        setShowNextButton(true);
    };

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
            setIsTyping(true);
            setShowNextButton(false);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
            {/* Win95 Modal Wrapper */}
            <div className="w-[450px] max-w-[95vw] win95-window shadow-[8px_8px_0_0_#000]">
                {/* Title Bar */}
                <div className="win95-title-bar px-2">
                    <span>Assistant(e) - Dora</span>
                    <button
                        onClick={onClose}
                        className="bg-[#c0c0c0] text-black font-bold px-2 py-0 border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
                    >
                        X
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-4 bg-[#c3c7cb]">
                    <div className="flex gap-3">
                        {/* Avatar */}
                        <div className="w-20 h-20 shrink-0 relative flex items-center justify-center border-2 border-[#808080] shadow-[2px_2px_0_0_#000] bg-slate-300">
                            {/* Le personnage 'bob' est utilisé comme fallback si 'dora' n'a pas encore de sprites, à changer si besoin */}
                            <AnimatedAvatar character="dora" isTalking={isTyping} />
                        </div>

                        {/* Dialogue Box */}
                        <div className="flex-1">
                            <span className="font-black uppercase text-xs pb-0.5 mb-1 block w-max border-b border-black">
                                Guide Tutoriel
                            </span>
                            {/* Clef de re-rendu pour forcer le reset machine à écrire au changement d'étape */}
                            <div key={currentStepIndex}>
                                <DoraDialogue
                                    message={t(steps[currentStepIndex] as any)}
                                    onComplete={handleDialogueComplete}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="mt-4 flex justify-end h-8">
                        {showNextButton && (
                            <button
                                onClick={handleNext}
                                className="win95-button px-6 font-bold text-sm"
                            >
                                {currentStepIndex < steps.length - 1 ? 'Suivant >' : 'Terminer'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
