import React, { useState, useEffect } from 'react';

interface GameLoaderProps {
    phase: string;
    error: string | null;
}

const TIPS = [
    "Astuce : Placez vos mines sur les bons gisements pour maximiser la production.",
    "Astuce : Les zones résidentielles ont besoin d'eau et d'électricité pour se développer.",
    "Astuce : Le bonheur de vos citoyens augmente vos revenus fiscaux.",
    "Astuce : Pensez à relier vos bâtiments industriels au réseau routier.",
    "Astuce : Investir dans les RWA (Real World Assets) génère des rendements passifs."
];

export const GameLoader: React.FC<GameLoaderProps> = ({ phase, error }) => {
    const [currentTip, setCurrentTip] = useState(0);

    // Rotation des astuces toutes les 3 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTip((prev) => (prev + 1) % TIPS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Traduction de la phase technique en texte UI
    const getStatusText = () => {
        if (error) return `❌ Erreur critique : ${error}`;
        switch (phase) {
            case 'loading_save': return 'Téléchargement de la ville depuis le cloud...';
            case 'preloading_assets': return 'Chargement des textures HD en cours...';
            case 'generating': return 'Génération procédurale du terrain...';
            case 'restoring': return 'Construction des routes et bâtiments...';
            case 'ready': return 'Prêt !';
            default: return 'Initialisation des systèmes...';
        }
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white font-mono overflow-hidden">

            {/* Background image simulé par un overlay sombre, le backdrop-blur fait le reste si le canvas est derrière, 
                mais là on cache avant que le canvas soit prêt, on peut ajouter un subtil gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black/90 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-8 text-center">

                {/* Logo / Titre Principal */}
                <h1
                    className="text-6xl font-black mb-12 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500"
                    style={{ textShadow: '0 0 20px rgba(74, 222, 128, 0.5)' }}
                >
                    EcoRWA TYCOON
                </h1>

                {/* Spinner & Status */}
                <div className="flex flex-col items-center mb-16 h-24">
                    {error ? (
                        <div className="text-red-500 border-2 border-red-500 p-4 font-bold bg-red-900/30">
                            {getStatusText()}
                        </div>
                    ) : (
                        <>
                            {/* Spinner style Win95 / Retro */}
                            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-6"></div>

                            <p className="text-xl text-green-400 animate-pulse font-bold">
                                {getStatusText()}
                            </p>
                        </>
                    )}
                </div>

                {/* Astuce tournante (style console) */}
                {!error && (
                    <div className="w-full bg-black/50 border border-green-500/30 p-4 rounded-sm">
                        <p className="text-sm text-gray-300 min-h-[40px] flex items-center justify-center transition-opacity duration-500">
                            <span className="text-green-500 mr-2">{'>'}</span> {TIPS[currentTip]}
                        </p>
                    </div>
                )}

            </div>

            {/* Version footprint */}
            <div className="absolute bottom-4 right-4 text-xs text-gray-600 font-mono">
                v0.1.0-alpha • Avalanche Testnet
            </div>
        </div>
    );
};
