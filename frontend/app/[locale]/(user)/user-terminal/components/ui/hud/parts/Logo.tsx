'use client';

import React from 'react';

export const Logo: React.FC = () => {
    return (
        <>
            {/* HEADER MOBILE (Logo + Hamburger placeholder logic is handled in TopBar) */}
            <div className="flex md:hidden flex-col leading-none" style={{ fontFamily: "'Pixelify Sans', 'Impact', sans-serif" }}>
                <span className="text-2xl font-black tracking-widest text-[#111] drop-shadow-[2px_2px_0_#fff] uppercase">
                    EcoRWA
                </span>
                <span className="text-[10px] font-black tracking-widest text-[#111] uppercase pl-1">
                    TYCOON
                </span>
            </div>

            {/* LEFT: Logo (Desktop Only) */}
            <div className="hidden md:flex flex-col leading-none mr-4" style={{ fontFamily: "'Pixelify Sans', 'Impact', sans-serif" }}>
                <span className="text-3xl font-black tracking-widest text-[#111] drop-shadow-[2px_2px_0_#fff] uppercase leading-none pb-1">
                    EcoRWA
                </span>
                <span className="text-sm font-black tracking-widest text-[#555] uppercase leading-none pl-[2px]">
                    TYCOON
                </span>
            </div>
        </>
    );
};
