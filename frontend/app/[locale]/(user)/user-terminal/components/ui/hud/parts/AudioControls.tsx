'use client';

import React from 'react';
import { useGameMusic } from '../../../../hooks/audio/useGameMusic';

export const AudioControls: React.FC = () => {
    const { isPlaying, volume, togglePlay, nextTrack, setVolume } = useGameMusic();

    return (
        <div className="flex items-center gap-2 bg-[#a9afb5] border-4 border-black p-1 shadow-[4px_4px_0_0_#000] h-[50px] w-full md:w-auto">
            <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center bg-slate-200 border-2 border-black text-sm transition-none rounded-none active:translate-y-px active:shadow-none"
                style={{ boxShadow: isPlaying ? 'none' : '2px 2px 0 0 #000', transform: isPlaying ? 'translate(2px, 2px)' : 'none' }}
            >
                {isPlaying ? '🔊' : '🔇'}
            </button>
            <button
                onClick={nextTrack}
                className="w-8 h-8 flex items-center justify-center bg-slate-200 border-2 border-black text-sm shadow-[2px_2px_0_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-none rounded-none"
            >
                {'>|'}
            </button>
            <div className="px-2 flex items-center flex-1 md:flex-none">
                <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full md:w-16 h-2 bg-slate-800 appearance-none cursor-pointer border border-black rounded-none"
                />
            </div>
        </div>
    );
};
