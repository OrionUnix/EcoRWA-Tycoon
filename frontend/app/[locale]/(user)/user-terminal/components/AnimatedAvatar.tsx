import React from 'react';
// Ajoute ton import ici (vérifie que le chemin correspond bien à l'emplacement de ton fichier)
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

interface AvatarProps {
    character: 'bob' | 'jordan';
    isTalking: boolean;
}

export const AnimatedAvatar: React.FC<AvatarProps> = ({ character, isTalking }) => {
    if (!isTalking) {
        return (
            <img
                // 1. On protège l'image statique
                src={withBasePath(`/assets/isometric/Spritesheet/character/${character}.png`)}
                alt={character}
                className="w-16 h-16 rounded-full border-2 border-black pixelated object-cover"
            />
        );
    }

    return (
        <div
            className="w-16 h-16 rounded-full border-2 border-black pixelated sprite-talk"
            // 2. On protège l'URL de fond (Attention aux guillemets simples à l'intérieur de url() !)
            style={{ backgroundImage: `url('${withBasePath(`/assets/isometric/Spritesheet/character/${character}_speak.png`)}')` }}
        />
    );
};