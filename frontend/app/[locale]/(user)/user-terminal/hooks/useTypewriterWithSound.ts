import { useState, useEffect } from 'react';

export const useTypewriterWithSound = (text: string, speed: number = 30) => {
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Check if window is defined (to prevent SSR errors)
        if (typeof window === 'undefined') return;

        // If text is empty, ensure no sound is playing
        if (!text) {
            setDisplayedText("");
            setIsTyping(false);
            return;
        }

        const audio = new Audio('/assets/sounds/sound fx/typewrite.mp3');
        audio.volume = 0.2; // Son discret
        audio.loop = true;

        let i = 0;
        let isCancelled = false;
        let p = audio.play().catch(e => console.warn('Audio play prevented:', e));

        setDisplayedText("");
        setIsTyping(true);

        const typeNextChar = () => {
            if (isCancelled) return;

            if (i < text.length) {
                setDisplayedText(text.slice(0, i + 1));
                const char = text[i];
                i++;

                // Calcul du délai dynamique
                let delay = speed;
                if (['.', '!', '?'].includes(char)) {
                    delay = speed + 400 + Math.random() * 200; // Pause longue
                } else if ([',', ':', ';'].includes(char)) {
                    delay = speed + 200 + Math.random() * 100; // Pause courte
                }

                setTimeout(typeNextChar, delay);
            } else {
                setIsTyping(false);
                audio.pause();
                audio.currentTime = 0;
            }
        };

        // Démarrage de la boucle de frappe
        setTimeout(typeNextChar, speed);

        return () => {
            isCancelled = true;
            setIsTyping(false);
            audio.pause();
            audio.currentTime = 0;
        };
    }, [text, speed]);

    return { displayedText, isTyping };
};
