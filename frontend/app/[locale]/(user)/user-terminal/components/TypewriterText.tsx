import React, { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
    text: string;
    speed?: number;
    onFinished?: () => void;
}

export const TypewriterText: React.FC<TypewriterProps> = ({ text, speed = 30, onFinished }) => {
    const [displayedText, setDisplayedText] = useState('');

    // Cette "mémoire" empêche React de redémarrer le texte en boucle
    const onFinishedRef = useRef(onFinished);

    useEffect(() => {
        onFinishedRef.current = onFinished;
    }, [onFinished]);

    useEffect(() => {
        setDisplayedText('');
        let i = 0;

        const timer = setInterval(() => {
            if (i < text.length) {
                // Affiche la phrase progressivement
                setDisplayedText(text.substring(0, i + 1));
                i++;
            } else {
                // Le texte est terminé, on arrête tout
                clearInterval(timer);
                if (onFinishedRef.current) onFinishedRef.current();
            }
        }, speed);

        // Nettoyage de sécurité
        return () => clearInterval(timer);

        // Le secret est ici : on ne relance l'effet QUE si le texte ou la vitesse change
    }, [text, speed]);

    return <span>{displayedText}</span>;
};