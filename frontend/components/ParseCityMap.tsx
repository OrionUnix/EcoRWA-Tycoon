'use client';

import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Building {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  owned: boolean;
  yield: string;
  price: string;
  pluAlert: string;
}

export default function ParseCityMap() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // 🔥 FIX: Générer les étoiles une seule fois avec useMemo
  const stars = useMemo(() => {
    return [...Array(80)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
  }, []); // Dépendances vides = génération unique

  const buildings: Building[] = [
    {
      id: 1,
      name: 'Loft Saint-Germain',
      x: 100,
      y: 200,
      width: 120,
      height: 180,
      color: '#8B5CF6',
      owned: false,
      yield: '4%',
      price: '150 USDC',
      pluAlert: 'Zone protégée, travaux interdits. Stabilité max.',
    },
    {
      id: 2,
      name: 'Le Bistrot Central',
      x: 350,
      y: 250,
      width: 100,
      height: 130,
      color: '#F59E0B',
      owned: false,
      yield: '8%',
      price: '100 USDC',
      pluAlert: 'Travaux de rue en 2026. Risque de vacance temporaire.',
    },
    {
      id: 3,
      name: 'Eco-Tower 2030',
      x: 550,
      y: 150,
      width: 140,
      height: 230,
      color: '#10B981',
      owned: false,
      yield: '6%',
      price: '250 USDC',
      pluAlert: 'Neuf. Exonération taxe foncière. Score Éco A+.',
    },
  ];

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-b from-blue-900 via-purple-900 to-slate-900 rounded-xl overflow-hidden shadow-2xl">
      {/* Étoiles animées - FIX HYDRATION */}
      <div className="absolute inset-0">
        {stars.map((star, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
            }}
          />
        ))}
      </div>

      {/* SVG de la ville */}
      <svg className="w-full h-full" viewBox="0 0 800 600">
        {/* Sol */}
        <rect x="0" y="400" width="800" height="200" fill="#1e293b" opacity="0.9" />
        
        {/* Route */}
        <rect x="0" y="380" width="800" height="20" fill="#374151" />
        <line 
          x1="0" y1="390" x2="800" y2="390" 
          stroke="#fbbf24" 
          strokeWidth="2" 
          strokeDasharray="20,15" 
        />

        {/* Arbres décoratifs */}
        {[50, 280, 480, 720].map((x, i) => (
          <g key={i}>
            <rect x={x} y="360" width="10" height="40" fill="#78350f" />
            <circle cx={x + 5} cy="350" r="25" fill="#10b981" opacity="0.8" />
          </g>
        ))}

        {/* Bâtiments */}
        {buildings.map((building) => (
          <motion.g
            key={building.id}
            onClick={() => setSelectedBuilding(building)}
            className="cursor-pointer"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            animate={
              building.owned
                ? {
                    filter: [
                      'drop-shadow(0 0 15px rgba(16,185,129,0.6))',
                      'drop-shadow(0 0 25px rgba(16,185,129,0.9))',
                      'drop-shadow(0 0 15px rgba(16,185,129,0.6))',
                    ],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: building.owned ? Infinity : 0,
            }}
          >
            {/* Corps du bâtiment */}
            <rect
              x={building.x}
              y={building.y}
              width={building.width}
              height={building.height}
              fill={building.color}
              stroke="#ffffff"
              strokeWidth="3"
              opacity="0.95"
              rx="2"
            />

            {/* Fenêtres lumineuses */}
            {[...Array(Math.floor(building.height / 35))].map((_, row) =>
              [...Array(Math.floor(building.width / 35))].map((_, col) => (
                <motion.rect
                  key={`${row}-${col}`}
                  x={building.x + 12 + col * 35}
                  y={building.y + 15 + row * 35}
                  width="18"
                  height="18"
                  fill="#fef3c7"
                  rx="2"
                  animate={{
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: (row + col) * 0.2, // Delay déterministe
                  }}
                />
              ))
            )}

            {/* Toit */}
            <polygon
              points={`${building.x},${building.y} ${building.x + building.width / 2},${building.y - 20} ${building.x + building.width},${building.y}`}
              fill={building.color}
              opacity="0.7"
            />

            {/* Badge "OWNED" */}
            {building.owned && (
              <g>
                <rect
                  x={building.x + building.width / 2 - 30}
                  y={building.y - 40}
                  width="60"
                  height="25"
                  fill="#10b981"
                  rx="4"
                />
                <text
                  x={building.x + building.width / 2}
                  y={building.y - 22}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  ✓ OWNED
                </text>
              </g>
            )}

            {/* Nom du bâtiment */}
            <text
              x={building.x + building.width / 2}
              y={building.y + building.height + 25}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="600"
              className="pointer-events-none"
            >
              {building.name}
            </text>
          </motion.g>
        ))}
      </svg>

      {/* Panel d'information */}
      {selectedBuilding && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="absolute bottom-6 left-6 right-6"
        >
          <Card className="p-6 bg-slate-900/95 backdrop-blur-xl border-slate-700 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {selectedBuilding.name}
                </h3>
                <div className="flex gap-2 mb-3">
                  <Badge variant="secondary" className="text-sm">
                    📈 Yield: {selectedBuilding.yield}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    💰 {selectedBuilding.price}/part
                  </Badge>
                  {selectedBuilding.owned && (
                    <Badge className="bg-green-500 text-sm">✓ Owned</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBuilding(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">🤖 Alerte PLU (IA)</p>
                <p className="text-sm text-slate-200">{selectedBuilding.pluAlert}</p>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" disabled={selectedBuilding.owned}>
                  {selectedBuilding.owned ? '✓ Déjà possédé' : '🏗️ Acheter des parts'}
                </Button>
                {selectedBuilding.owned && (
                  <Button variant="outline" className="flex-1">
                    💸 Claim Yields
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}