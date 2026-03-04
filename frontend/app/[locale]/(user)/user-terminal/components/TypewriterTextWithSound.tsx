'use client';
import React from 'react';
import { useTypewriterWithSound } from '../hooks/useTypewriterWithSound';

interface TypewriterTextWithSoundProps {
    text: string;
    speed?: number;
    onFinished?: () => void;
}

/**
 * Composant Typewriter avec effet sonore rétro (typewrite.mp3).
 * Remplace <TypewriterText> partout où un effet sonore est souhaité.
 * Utilise key={text} sur le parent pour forcer le reset quand le texte change.
 */
export const TypewriterTextWithSound: React.FC<TypewriterTextWithSoundProps> = ({ text, speed = 22, onFinished }) => {
    const { displayedText, isTyping } = useTypewriterWithSound(text, speed);

    // Notifie le parent quand la frappe est terminée
    React.useEffect(() => {
        if (!isTyping && displayedText.length === text.length && text.length > 0) {
            onFinished?.();
        }
    }, [isTyping, displayedText, text, onFinished]);

    return <span>{displayedText}</span>;
};

export default TypewriterTextWithSound;
