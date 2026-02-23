import React from 'react';

interface AvatarProps {
    character: 'bob' | 'jordan';
    isTalking: boolean;
}

export const AnimatedAvatar: React.FC<AvatarProps> = ({ character, isTalking }) => {
    if (!isTalking) {
        return (
            <img
                src={`/assets/isometric/Spritesheet/character/${character}.png`}
                alt={character}
                // J'ai retiré le bg-slate-800 qui faisait un carré noir
                className="w-16 h-16 rounded-full border-2 border-black pixelated object-cover"
            />
        );
    }

    return (
        <div
            className="w-16 h-16 rounded-full border-2 border-black pixelated sprite-talk"
            style={{ backgroundImage: `url('/assets/isometric/Spritesheet/character/${character}_speak.png')` }}
        />
    );
};