'use client';

import dynamic from 'next/dynamic';

// 1. Import dynamique avec SSR désactivé
// Cela force Next.js à ne charger ce composant que dans le navigateur
const GameClientWrapper = dynamic(
    () => import('./components/GameCanvas'), // Assure-toi que le chemin est bon
    {
        ssr: false,
        loading: () => (
            // Un écran de chargement simple pendant que Pixi s'initialise
            <div className="w-full h-screen bg-slate-900 flex items-center justify-center text-green-500 font-mono">
                INITIALIZING GRAPHICS ENGINE...
            </div>
        )
    }
);

export default function UserTerminalPage() {
    return (
        <main className="w-full h-screen overflow-hidden bg-black">
            <GameClientWrapper />
        </main>
    );
}