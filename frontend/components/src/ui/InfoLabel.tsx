'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

interface InfoLabelProps {
  label: string;
  description: string;
}

export const InfoLabel = ({ label, description }: InfoLabelProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Sécurité renforcée : On vérifie si la description ressemble à une clé non traduite
  // (Typiquement quand elle contient le namespace ou des points)
  const isKeyMissing = !description || description.includes('infoMarket.') || description.split('.').length > 1;
  const displayContent = isKeyMissing ? "Information non disponible" : description;

  return (
    <div className="flex items-center gap-2 relative">
      <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] select-none">
        {label}
      </span>
      
      <div 
        className="relative flex items-center"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onTouchStart={() => setIsVisible(!isVisible)} // Meilleur support mobile
      >
        <HelpCircle 
          size={12} 
          className={`cursor-help transition-all duration-300 ${
            isVisible ? 'text-[#E84142] scale-110' : 'text-slate-600'
          }`} 
        />

        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-[#0f172a]/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]"
            >
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] border-r border-b border-white/15 rotate-45" />
              <p className={`text-[11px] leading-relaxed font-medium ${
                !isKeyMissing ? 'text-slate-200' : 'text-slate-500 italic'
              }`}>
                {displayContent}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};