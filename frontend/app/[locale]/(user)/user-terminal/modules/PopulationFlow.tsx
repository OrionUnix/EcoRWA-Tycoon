// app/[locale]/(user)/user-terminal/modules/PopulationFlow.tsx
'use client';

import { motion } from 'framer-motion';

export function PopulationFlow() {
  // On simule des particules qui suivent des chemins SVG imaginaires (à remplacer par tes IDs)
  return (
    <div className="absolute inset-0 z-20 pointer-events-none opacity-60">
      <svg className="w-full h-full">
        {/* Exemple d'une particule sur un chemin */}
        {[...Array(20)].map((_, i) => (
          <motion.circle
            key={i}
            r="1.5"
            fill="#fff"
            filter="blur(1px)"
            initial={{ offsetDistance: "0%", opacity: 0 }}
            animate={{ 
              offsetDistance: "100%", 
              opacity: [0, 1, 1, 0] 
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
            style={{ offsetPath: `path('M100,100 Q400,300 800,100')` }} // C'est ici qu'on mettra tes chemins Illustrator
          />
        ))}
      </svg>
    </div>
  );
}