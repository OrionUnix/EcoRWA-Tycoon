'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDisconnect } from 'wagmi';
import { PersistenceManager } from '../../../engine/systems/PersistenceManager';
import { SaveSystem } from '../../../engine/systems/SaveSystem';
import { MapEngine } from '../../../engine/MapEngine';

interface LogoutButtonProps {
    engine: MapEngine;
    address: string;
}

/**
 * LogoutButton - Gère la séquence de déconnexion "propre" (Win95 style)
 * 1. Sauvegarde finale
 * 2. Nettoyage sessions
 * 3. Déconnexion wallet
 * 4. Redirection
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({ engine, address }) => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [statusText, setStatusText] = useState("");
    const { disconnectAsync } = useDisconnect();
    const router = useRouter();

    const handleLogout = async () => {
        setIsLoggingOut(true);

        try {
            // Étape 1 : Sauvegarde Cloud forcée
            setStatusText("Initiating final cloud synchronization...");
            await new Promise(resolve => setTimeout(resolve, 800));

            setStatusText("Serializing city infrastructure (v5)...");
            await new Promise(resolve => setTimeout(resolve, 600));

            // On utilise SaveSystem directement pour un feedback granulaire
            const result = await SaveSystem.saveToCloud(engine, address);

            if (result) {
                setStatusText(`Sync successful! Payload: ${result.sizeKB} KB.`);
                await new Promise(resolve => setTimeout(resolve, 800));
            } else {
                setStatusText("Warning: Cloud sync bypassed. Storage busy.");
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Étape 2 : Nettoyage local
            setStatusText("Purging ephemeral city cache...");
            SaveSystem.clearSave();
            localStorage.removeItem('eco_tycoon_local_save');
            await new Promise(resolve => setTimeout(resolve, 800));

            // Étape 3 : Déconnexion Web3
            setStatusText("Disconnecting secure wallet link...");
            await disconnectAsync();
            await new Promise(resolve => setTimeout(resolve, 600));

            // Étape 4 : Adieu et Redirection
            setStatusText("Goodbye Mayor! System halting safely...");

            setTimeout(() => {
                router.push('/'); // Redirection vers l'accueil
            }, 1200);

        } catch (error) {
            console.error("Logout sequence failure:", error);
            setStatusText("FATAL ERROR: Save aborted. Forcing exit...");
            setTimeout(async () => {
                try { await disconnectAsync(); } catch (e) { }
                router.push('/');
            }, 2000);
        }
    };

    return (
        <>
            {/* BOUTON LOGOUT (Style TopBar) */}
            <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-[#c3c7cb] text-black font-bold border-4 border-black px-4 h-[50px] flex items-center hover:bg-red-500 hover:text-white active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-none disabled:opacity-50"
            >
                {isLoggingOut ? 'EXIT...' : 'LOGOUT'}
            </button>

            {/* MODAL DE SHUTDOWN (Full Screen) */}
            {isLoggingOut && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
                    <div className="win95-window w-[400px] p-4 flex flex-col gap-4">
                        <div className="win95-title-bar bg-[#000080]">
                            <span className="text-white text-sm font-bold tracking-tight">Windows 95 - Shutdown in progress</span>
                        </div>

                        <div className="flex items-start gap-4 bg-[#c3c7cb] p-4 border-2 border-t-white border-l-white border-b-[#424242] border-r-[#424242]">
                            <div className="w-16 h-16 bg-white border-2 border-t-[#868a8e] border-l-[#868a8e] border-b-white border-r-white shadow-[inset_1px_1px_0_0_#000] flex items-center justify-center text-4xl p-2 select-none">
                                💾
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                                <h2 className="font-bold text-[#000080] text-lg uppercase tracking-tight leading-none mb-1">System Halt</h2>
                                <p className="text-black text-xs font-mono leading-tight min-h-[3.5em]">
                                    {statusText}
                                    <span className="animate-pulse">_</span>
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar (Fake but nostalgic) */}
                        <div className="flex flex-col gap-1 px-1">
                            <div className="h-6 border-2 border-t-[#868a8e] border-l-[#868a8e] border-b-white border-r-white bg-[#808080] p-[2px] flex gap-[2px]">
                                <div className="h-full w-1/4 bg-[#000080]"></div>
                                <div className="h-full w-1/4 bg-[#000080]"></div>
                                <div className="h-full w-1/4 bg-[#000080]"></div>
                                <div className="h-full w-1/4 bg-[#000080] animate-pulse"></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-black uppercase">
                                <span>Processing metrics...</span>
                                <span>Secure Logout</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
