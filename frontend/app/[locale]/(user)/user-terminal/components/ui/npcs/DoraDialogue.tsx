'use client';

import React, { useState } from 'react';
import { TypewriterTextWithSound } from '../../TypewriterTextWithSound';

export interface DoraDialogueProps {
    message: string;
    iconUrl?: string;
    onComplete?: () => void;
}

/**
 * DoraDialogue - Boîte de dialogue style Windows 95 pour le tutoriel
 * Intègre l'effet machine à écrire avec son et pauses de ponctuation.
 */
export const DoraDialogue: React.FC<DoraDialogueProps> = ({ message, iconUrl, onComplete }) => {
    return (
        <div className="win95-inset bg-white p-4 pr-10 relative min-h-[100px] flex flex-row items-center gap-4">
            {/* L'icône s'affiche désormais sans cadre, plus proprement */}
            {iconUrl && (
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                    <img src={iconUrl} alt="Tutorial Hint Icon" className="pixelated max-w-full max-h-full drop-shadow-lg" />
                </div>
            )}

            <div className="flex-1">
                {/* Flèche clignotante en bas à droite pour indiquer la continuité (optionnel) */}
                <div className="absolute bottom-2 right-3 animate-pulse text-[16px] font-black text-gray-400">
                    ▼
                </div>

                <p className="text-[17px] leading-snug font-medium text-black">
                    <TypewriterTextWithSound
                        text={message}
                        speed={40}  // 40ms par caractère comme demandé
                        onFinished={onComplete}
                    />
                </p>
            </div>
        </div>
    );
};
