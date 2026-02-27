'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedAvatar } from './AnimatedAvatar';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface JordanPitchModalProps {
    visible: boolean;
    onClose: () => void;
    onConnectPlay: () => void;
    isConnected: boolean;
}

const MOCK_RWA_PROPERTIES = [
    {
        id: 'rwa-1',
        title: 'Industrial Loft',
        location: 'Brooklyn, NY',
        apy: '8.5%',
        pricePerShare: 50,
        totalShares: 500,
        availableShares: 150,
        image: '🏢'
    },
    {
        id: 'rwa-2',
        title: 'Parisian Bistro',
        location: 'Paris, FR',
        apy: '6.2%',
        pricePerShare: 100,
        totalShares: 200,
        availableShares: 45,
        image: '🍷'
    },
    {
        id: 'rwa-3',
        title: 'Solar Farm Alpha',
        location: 'Nevada, US',
        apy: '12.0%',
        pricePerShare: 25,
        totalShares: 1000,
        availableShares: 800,
        image: '☀️'
    }
];

export const JordanPitchModal: React.FC<JordanPitchModalProps> = ({ visible, onClose, onConnectPlay, isConnected }) => {
    const { openConnectModal } = useConnectModal();

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto font-[Pixelify_Sans]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-gray-900 border-4 border-gray-700 shadow-[8px_8px_0_rgba(0,0,0,1)] w-[800px] max-w-[95vw] p-1 flex flex-col max-h-[90vh]"
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        {/* Header */}
                        <div className="bg-[#1E3A8A] px-4 py-2 flex items-center justify-between border-b-4 border-gray-700 shrink-0">
                            <span className="text-white font-black text-sm uppercase tracking-widest text-[#60A5FA]">
                                💼 Web3 Expert Jordan
                            </span>
                            <button
                                onClick={onClose}
                                className="text-white/70 hover:text-white font-black text-2xl leading-none transition-colors"
                            >
                                ×
                            </button>
                        </div>

                        {/* Corps (Scrollable if needed) */}
                        <div className="p-6 flex flex-col gap-6 overflow-y-auto">

                            {/* Dialogue Area */}
                            <div className="flex gap-4 items-start bg-gray-800 p-4 border-2 border-gray-700 rounded-xl relative">
                                <div className="shrink-0">
                                    <AnimatedAvatar character="jordan" isTalking={true} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[#60A5FA] font-black uppercase text-sm mb-1 tracking-wider">Investment Advisor</h3>
                                    <p className="text-white text-[18px] font-bold leading-normal drop-shadow-[2px_2px_0_#000]">
                                        {!isConnected
                                            ? "Hey! You're currently in Observation Mode. You can see these amazing opportunities, but to actually buy shares and start earning RWA yields, you'll need to link your city to the blockchain."
                                            : "Welcome back! Here are the hottest RWA opportunities on the market right now. Buy shares to boost your city's economy!"}
                                    </p>

                                    {!isConnected && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => {
                                                    if (openConnectModal) {
                                                        onClose();
                                                        openConnectModal();
                                                    }
                                                }}
                                                className="px-6 py-2 bg-[#3B82F6] border-4 border-[#1D4ED8] hover:bg-[#60A5FA] hover:border-[#2563EB] text-white font-bold uppercase tracking-widest text-sm transition-all shadow-[4px_4px_0_#000]"
                                            >
                                                Connect Wallet to Invest 🦊
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RWA Horizontal Grid */}
                            <div className="flex flex-col gap-2">
                                <h4 className="text-white font-black text-xl uppercase tracking-widest drop-shadow-[2px_2px_0_#000]">Premium Properties</h4>
                                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                                    {MOCK_RWA_PROPERTIES.map((rwa) => (
                                        <div key={rwa.id} className="snap-start shrink-0 w-[240px] bg-gray-800 border-4 border-gray-700 flex flex-col shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
                                            {/* Card Image / Icon Header */}
                                            <div className="h-24 bg-gray-700 flex items-center justify-center text-4xl border-b-4 border-gray-600">
                                                {rwa.image}
                                            </div>

                                            {/* Card Content */}
                                            <div className="p-4 flex flex-col gap-3 flex-1">
                                                <div>
                                                    <h5 className="text-white font-bold text-lg leading-tight truncate">{rwa.title}</h5>
                                                    <p className="text-gray-400 text-xs uppercase tracking-wide">{rwa.location}</p>
                                                </div>

                                                <div className="flex justify-between items-center bg-gray-900 border-2 border-gray-700 p-2">
                                                    <span className="text-gray-400 text-xs">Est. APY</span>
                                                    <span className="text-[#4CAF50] font-black text-sm">{rwa.apy}</span>
                                                </div>

                                                <div className="space-y-1 mt-auto">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400">Price/Share</span>
                                                        <span className="text-white font-bold">${rwa.pricePerShare}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400">Available</span>
                                                        <span className="text-white font-bold">
                                                            {!isConnected ? "---" : `${rwa.availableShares} / ${rwa.totalShares}`}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-400">Your Inv.</span>
                                                        <span className="text-white font-bold text-[#60A5FA]">
                                                            {!isConnected ? "Connect to view" : "0 Shares"}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <button
                                                    disabled={!isConnected}
                                                    className={`mt-2 w-full py-2 border-4 font-black uppercase text-sm tracking-widest transition-all shadow-[2px_2px_0_#000]
                                                        ${!isConnected
                                                            ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                                            : 'bg-[#4CAF50] border-[#2E7D32] text-white hover:bg-[#66BB6A] hover:border-[#388E3C] cursor-pointer'
                                                        }`}
                                                >
                                                    {isConnected ? "INSPECT ▶" : "🔒 LOCKED"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
