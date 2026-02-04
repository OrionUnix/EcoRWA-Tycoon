'use client';

// ERREUR AVANT : import { GameCanvas } from './GameCanvas';
// CORRECTION : Pas d'accolades pour un export default
import GameCanvas from './GameCanvas';

export default function GameSceneWrapper() {
    return (
        <div className="w-full h-full">
            <GameCanvas />
        </div>
    );
}