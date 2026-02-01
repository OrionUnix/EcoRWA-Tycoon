'use client';

import React from 'react';
import { motion } from 'framer-motion';

const categories = [
    { id: 1, name: 'Police', icon: '👮', color: '#3b82f6' },
    { id: 2, name: 'School', icon: '📚', color: '#10b981' },
    { id: 3, name: 'Hospital', icon: '🏥', color: '#ef4444' },
    { id: 4, name: 'Work', icon: '💼', color: '#8b5cf6' },
    { id: 5, name: 'Restaurant', icon: '🍽️', color: '#f59e0b' },
    { id: 6, name: 'Hotel', icon: '🏨', color: '#ec4899' },
    { id: 7, name: 'Market', icon: '🛒', color: '#14b8a6' },
];

export default function CategoryTabs() {
    const [selected, setSelected] = React.useState(1);

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_rgba(59,130,246,0.2)]"
        >
            <h3 className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-4">
                Building Categories
            </h3>

            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {categories.map((cat) => (
                    <motion.button
                        key={cat.id}
                        onClick={() => setSelected(cat.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
              relative overflow-hidden rounded-xl p-3 transition-all duration-300
              ${selected === cat.id
                                ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border-2 border-cyan-400'
                                : 'bg-white/5 border border-white/10'
                            }
            `}
                        style={{
                            boxShadow: selected === cat.id ? `0 0 20px ${cat.color}40` : 'none'
                        }}
                    >
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{cat.icon}</span>
                            <span className={`text-[10px] font-mono ${selected === cat.id ? 'text-cyan-300' : 'text-white/50'}`}>
                                {cat.name}
                            </span>
                        </div>

                        {selected === cat.id && (
                            <motion.div
                                layoutId="activeCategory"
                                className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
