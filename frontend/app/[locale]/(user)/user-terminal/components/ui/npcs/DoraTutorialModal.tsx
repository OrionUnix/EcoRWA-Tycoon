'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatedAvatar } from './AnimatedAvatar';
import { DoraDialogue } from './DoraDialogue';
import { useTutorialStore } from '../../../hooks/useTutorialStore';
import { DORA_TUTORIAL_STEPS } from './TutorialScript';
import { GAME_ICONS } from '@/hooks/ui/useGameIcons';

interface DoraTutorialModalProps {
    onClose: () => void;
}

export const DoraTutorialModal: React.FC<DoraTutorialModalProps> = ({ onClose }) => {
    const t = useTranslations('doratuto');
    const { currentStepIndex, nextStep, stopTutorial, isActive, isVisible, errorKey } = useTutorialStore();

    const [isTyping, setIsTyping] = useState(true);
    const [showNextButton, setShowNextButton] = useState(false);

    if (!isActive || !isVisible) return null;

    const currentStep = DORA_TUTORIAL_STEPS[currentStepIndex];

    const handleDialogueComplete = () => {
        setIsTyping(false);
        // On n'affiche le bouton "Suivant" QUE si l'étape n'attend pas d'action du joueur
        if (!currentStep.waitForAction) {
            setShowNextButton(true);
        }
    };

    const handleNext = () => {
        if (currentStepIndex < DORA_TUTORIAL_STEPS.length - 1) {
            nextStep();
            setIsTyping(true);
            setShowNextButton(false);
        } else {
            stopTutorial();
            onClose();
        }
    };

    // Si le dialogue en cours change depuis l'extérieur (ex: advanceTutorial appelé), on reset
    React.useEffect(() => {
        setIsTyping(true);
        setShowNextButton(false);
    }, [currentStepIndex]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
            {/* Win95 Modal Wrapper */}
            <div className="w-[450px] max-w-[95vw] win95-window shadow-[8px_8px_0_0_#000] pointer-events-auto">
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
                    <div className="flex gap-4 items-center">
                        {/* Avatar */}
                        <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
                            {/* Le personnage 'bob' est utilisé comme fallback si 'dora' n'a pas encore de sprites, à changer si besoin */}
                            <AnimatedAvatar character="dora" isTalking={isTyping} />
                        </div>

                        {/* Dialogue Box */}
                        <div className="flex-1">
                            <div className="border-b border-black mb-1 pb-0.5">
                                <span className="font-black uppercase text-xs block w-max">
                                    Guide Tutoriel
                                </span>
                            </div>

                            {/* Clef de re-rendu pour forcer le reset machine à écrire au changement d'étape ou ERREUR */}
                            <div key={errorKey ? `error-${errorKey}` : currentStepIndex}>
                                <DoraDialogue
                                    message={errorKey ? t(errorKey as any) : t(currentStep.textKey as any)}
                                    iconUrl={currentStep.iconName ? GAME_ICONS[currentStep.iconName] : undefined}
                                    onComplete={handleDialogueComplete}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="mt-4 flex justify-end h-8">
                        {showNextButton && !currentStep.waitForAction && (
                            <button
                                onClick={handleNext}
                                className="win95-button px-6 font-bold text-sm"
                            >
                                {currentStepIndex < DORA_TUTORIAL_STEPS.length - 1 ? 'Suivant >' : 'Terminer'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
