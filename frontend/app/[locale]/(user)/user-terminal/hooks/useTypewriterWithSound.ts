import { useState, useEffect } from 'react';

export const useTypewriterWithSound = (text: string, speed: number = 30) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        // Check if window is defined (to prevent SSR errors)
        if (typeof window === 'undefined') return;

        const audio = new Audio('/assets/sounds/sound fx/typewrite.mp3');
        audio.volume = 0.2; // Son discret
        audio.loop = true;

        let i = 0;
        setDisplayedText("");

        // Auto-play might be blocked by browser policy without interaction, 
        // catch potential DOMExceptions
        audio.play().catch(e => console.warn('Audio play prevented:', e));

        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
                audio.pause();
                audio.currentTime = 0;
            }
        }, speed);

        return () => {
            clearInterval(timer);
            audio.pause();
        };
    }, [text, speed]);

    return displayedText;
};
