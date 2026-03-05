'use client';

import React, { useState } from 'react';
import { TypewriterTextWithSound } from '../../TypewriterTextWithSound';

export interface DoraDialogueProps {
    message: string;
    onComplete?: () => void;
}

/**
 * DoraDialogue - Boîte de dialogue style Windows 95 pour le tutoriel
 * Intègre l'effet machine à écrire avec son et pauses de ponctuation.
 */
export const DoraDialogue: React.FC<DoraDialogueProps> = ({ message, onComplete }) => {
    return (
        <div className="win95-inset bg-white p-3 pr-8 relative min-h-[80px] flex flex-col justify-center">
            {/* Flèche clignotante en bas à droite pour indiquer la continuité (optionnel) */}
            <div className="absolute bottom-1 right-2 animate-pulse text-xs font-black text-gray-400">
                ▼
            </div>

            <p className="text-[14px] leading-tight font-medium text-black">
                <TypewriterTextWithSound
                    text={message}
                    speed={40}  // 40ms par caractère comme demandé
                    onFinished={onComplete}
                />
            </p>
        </div>
    );
};
