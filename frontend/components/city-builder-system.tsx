import React, { useState, useEffect } from 'react';
import { Mountain, Droplets, Flame, Diamond, DollarSign, Gem, ShoppingCart, Pickaxe, TrendingUp, Users } from 'lucide-react';

// Types
interface Resource {
  type: 'gold' | 'diamond' | 'water' | 'oil' | 'silver' | 'coal';
  amount: number;
  extractionRate: number; // par heure
}

interface TerrainCell {
  x: number;
  y: number;
  terrain: 'plains' | 'mountain' | 'water' | 'forest' | 'desert';
  resources: Resource[];
  building: Building | null;
  discovered: boolean;
}

interface Building {
  type: 'mine' | 'well' | 'refinery' | 'warehouse';
  level: number;
  extracting: Resource['type'] | null;
}

interface PlayerInventory {
  gold: number;
  diamond: number;
  water: number;
  oil: number;
  silver: number;
  coal: number;
}

interface MarketListing {
  id: string;
  seller: string;
  resource: Resource['type'];
  amount: number;
  pricePerUnit: number;
  totalPrice: number;
}

const GRID_SIZE = 30;
const RESOURCE_ICONS = {
  gold: { icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  diamond: { icon: Diamond, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  water: { icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  oil: { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  silver: { icon: Gem, color: 'text-gray-300', bg: 'bg-gray-500/20' },
  coal: { icon: Mountain, color: 'text-gray-600', bg: 'bg-gray-700/20' },
};

// Génération procédurale avec Perlin-like noise
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generateProceduralMap(seed: number): TerrainCell[][] {
  const map: TerrainCell[][] = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    map[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const noise = seededRandom(seed + x * 1000 + y);
      
      // Déterminer le terrain
      let terrain: TerrainCell['terrain'] = 'plains';
      if (noise > 0.8) terrain = 'mountain';
      else if (noise > 0.6) terrain = 'forest';
      else if (noise < 0.2) terrain = 'water';
      else if (noise < 0.3) terrain = 'desert';
      
      // Générer des ressources selon le terrain
      const resources: Resource[] = [];
      
      if (terrain === 'mountain') {
        if (seededRandom(seed + x + y * 10) > 0.7) {
          resources.push({
            type: 'gold',
            amount: Math.floor(seededRandom(seed + x * y) * 100 + 50),
            extractionRate: Math.floor(seededRandom(seed + x + y) * 5 + 2)
          });
        }
        if (seededRandom(seed + x * 2 + y) > 0.85) {
          resources.push({
            type: 'diamond',
            amount: Math.floor(seededRandom(seed + x * y * 2) * 50 + 10),
            extractionRate: Math.floor(seededRandom(seed + x - y) * 2 + 1)
          });
        }
        if (seededRandom(seed + x + y * 3) > 0.6) {
          resources.push({
            type: 'coal',
            amount: Math.floor(seededRandom(seed + x * y * 3) * 200 + 100),
            extractionRate: Math.floor(seededRandom(seed + x * 3) * 10 + 5)
          });
        }
      }
      
      if (terrain === 'water') {
        resources.push({
          type: 'water',
          amount: 9999, // infini
          extractionRate: Math.floor(seededRandom(seed + x * y) * 20 + 10)
        });
      }
      
      if (terrain === 'desert') {
        if (seededRandom(seed + x * 5 + y) > 0.75) {
          resources.push({
            type: 'oil',
            amount: Math.floor(seededRandom(seed + x * y * 5) * 150 + 50),
            extractionRate: Math.floor(seededRandom(seed + x * 2) * 8 + 3)
          });
        }
      }
      
      if (terrain === 'plains' || terrain === 'forest') {
        if (seededRandom(seed + x * 4 + y * 2) > 0.8) {
          resources.push({
            type: 'silver',
            amount: Math.floor(seededRandom(seed + x * y * 4) * 80 + 30),
            extractionRate: Math.floor(seededRandom(seed + y * 2) * 4 + 2)
          });
        }
      }
      
      map[y][x] = {
        x,
        y,
        terrain,
        resources,
        building: null,
        discovered: x < 5 && y < 5 // Zone de départ découverte
      };
    }
  }
  
  return map;
}

export default function ProceduralCityBuilder() {
  const [citySeed] = useState(() => Math.floor(Math.random() * 999999));
  const [map, setMap] = useState<TerrainCell[][]>(() => generateProceduralMap(citySeed));
  const [inventory, setInventory] = useState<PlayerInventory>({
    gold: 0,
    diamond: 0,
    water: 0,
    oil: 0,
    silver: 0,
    coal: 0
  });
  const [ecor, setEcor] = useState(1000);
  const [selectedCell, setSelectedCell] = useState<TerrainCell | null>(null);
  const [showMarket, setShowMarket] = useState(false);
  const [marketListings, setMarketListings] = useState<MarketListing[]>([
    {
      id: '1',
      seller: '0x742d...Ab3C',
      resource: 'gold',
      amount: 50,
      pricePerUnit: 10,
      totalPrice: 500
    },
    {
      id: '2',
      seller: '0x8a1f...Cd2E',
      resource: 'diamond',
      amount: 10,
      pricePerUnit: 100,
      totalPrice: 1000
    }
  ]);

  // Extraction automatique des ressources
  useEffect(() => {
    const interval = setInterval(() => {
      const newMap = [...map];
      const newInventory = { ...inventory };
      
      map.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell.building?.extracting) {
            const resource = cell.resources.find(r => r.type === cell.building!.extracting);
            if (resource && resource.amount > 0) {
              const extracted = Math.min(resource.extractionRate / 3600, resource.amount); // Par seconde
              newInventory[resource.type] += extracted;
              if (resource.type !== 'water') {
                resource.amount -= extracted;
              }
            }
          }
        });
      });
      
      setInventory(newInventory);
      setMap(newMap);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [map]);

  const discoverCell = (x: number, y: number) => {
    const cost = 50; // ECOR
    if (ecor < cost) return;
    
    const newMap = [...map];
    newMap[y][x].discovered = true;
    setMap(newMap);
    setEcor(ecor - cost);
  };

  const buildMine = (x: number, y: number, resourceType: Resource['type']) => {
    const cost = 200; // ECOR
    if (ecor < cost) return;
    
    const newMap = [...map];
    newMap[y][x].building = {
      type: 'mine',
      level: 1,
      extracting: resourceType
    };
    setMap(newMap);
    setEcor(ecor - cost);
  };

  const sellResource = (resourceType: Resource['type'], amount: number, pricePerUnit: number) => {
    if (inventory[resourceType] < amount) return;
    
    const newListing: MarketListing = {
      id: Date.now().toString(),
      seller: 'Vous',
      resource: resourceType,
      amount,
      pricePerUnit,
      totalPrice: amount * pricePerUnit
    };
    
    const newInventory = { ...inventory };
    newInventory[resourceType] -= amount;
    setInventory(newInventory);
    setMarketListings([...marketListings, newListing]);
  };

  const buyFromMarket = (listing: MarketListing) => {
    if (ecor < listing.totalPrice) return;
    
    const newInventory = { ...inventory };
    newInventory[listing.resource] += listing.amount;
    setInventory(newInventory);
    setEcor(ecor - listing.totalPrice);
    setMarketListings(marketListings.filter(l => l.id !== listing.id));
  };

  const getTerrainColor = (terrain: TerrainCell['terrain']) => {
    switch (terrain) {
      case 'mountain': return 'bg-gray-700';
      case 'water': return 'bg-blue-600';
      case 'forest': return 'bg-green-700';
      case 'desert': return 'bg-yellow-700';
      default: return 'bg-green-600';
    }
  };

  const getTotalResourceValue = () => {
    return Object.entries(inventory).reduce((sum, [resource, amount]) => {
      const marketValue = {
        gold: 10,
        diamond: 100,
        water: 1,
        oil: 20,
        silver: 5,
        coal: 2
      }[resource as Resource['type']] || 0;
      return sum + (amount * marketValue);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header Stats */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-yellow-500/20 rounded-xl p-3 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-xs">$ECOR</span>
              </div>
              <div className="text-xl font-bold text-white">{ecor.toFixed(0)}</div>
            </div>
            
            {Object.entries(inventory).map(([resource, amount]) => {
              const config = RESOURCE_ICONS[resource as Resource['type']];
              const Icon = config.icon;
              return (
                <div key={resource} className={`${config.bg} rounded-xl p-3 border border-white/20`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className={`${config.color} text-xs capitalize`}>{resource}</span>
                  </div>
                  <div className="text-xl font-bold text-white">{amount.toFixed(1)}</div>
                </div>
              );
            })}
            
            <div className="bg-purple-500/20 rounded-xl p-3 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-xs">Valeur</span>
              </div>
              <div className="text-xl font-bold text-white">{getTotalResourceValue().toFixed(0)}</div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowMarket(!showMarket)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Marketplace
            </button>
            
            <div className="bg-black/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-white font-semibold">Seed: {citySeed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr,400px] gap-4">
        {/* Map */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
          <h2 className="text-white text-xl font-bold mb-3">🗺️ Votre Territoire (Seed: {citySeed})</h2>
          <div className="overflow-auto max-h-[600px] rounded-xl bg-black/30 p-2">
            <div className="inline-grid gap-0.5">
              {map.map((row, y) => (
                <div key={y} className="flex gap-0.5">
                  {row.map((cell, x) => (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => cell.discovered ? setSelectedCell(cell) : discoverCell(x, y)}
                      className={`w-4 h-4 rounded-sm transition-all relative ${
                        cell.discovered 
                          ? getTerrainColor(cell.terrain) 
                          : 'bg-gray-900'
                      } ${
                        selectedCell?.x === x && selectedCell?.y === y 
                          ? 'ring-2 ring-white scale-125 z-10' 
                          : 'hover:scale-110'
                      }`}
                      title={cell.discovered ? `${cell.terrain} (${cell.resources.length} ressources)` : 'Explorer (50 ECOR)'}
                    >
                      {cell.building && (
                        <Pickaxe className="w-3 h-3 text-yellow-400 absolute inset-0 m-auto" />
                      )}
                      {!cell.discovered && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[8px] text-gray-400">?</div>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Cell Details */}
          {selectedCell && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
              <h3 className="text-white font-bold text-lg mb-3">
                📍 Zone ({selectedCell.x}, {selectedCell.y})
              </h3>
              
              <div className="bg-black/30 rounded-xl p-3 mb-3">
                <div className="text-gray-300 text-sm mb-1">Terrain</div>
                <div className="text-white font-semibold capitalize">{selectedCell.terrain}</div>
              </div>

              {selectedCell.resources.length > 0 ? (
                <div className="space-y-2 mb-3">
                  <div className="text-white font-semibold">Ressources disponibles:</div>
                  {selectedCell.resources.map((resource, idx) => {
                    const config = RESOURCE_ICONS[resource.type];
                    const Icon = config.icon;
                    return (
                      <div key={idx} className={`${config.bg} rounded-lg p-3 border border-white/20`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${config.color}`} />
                            <span className={`${config.color} font-semibold capitalize`}>{resource.type}</span>
                          </div>
                          <div className="text-white font-bold">{resource.amount === 9999 ? '∞' : resource.amount.toFixed(0)}</div>
                        </div>
                        <div className="text-xs text-gray-300">
                          Extraction: {resource.extractionRate}/h
                        </div>
                        {!selectedCell.building && (
                          <button
                            onClick={() => buildMine(selectedCell.x, selectedCell.y, resource.type)}
                            className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all"
                          >
                            Construire Mine (200 ECOR)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 text-sm italic">Aucune ressource sur cette zone</div>
              )}

              {selectedCell.building && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Pickaxe className="w-5 h-5 text-green-400" />
                    <span className="text-white font-semibold">Mine active</span>
                  </div>
                  <div className="text-green-300 text-sm">
                    Extrait: {selectedCell.building.extracting}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Sell */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <h3 className="text-white font-bold mb-3">💰 Vente Rapide</h3>
            <div className="space-y-2">
              {Object.entries(inventory).map(([resource, amount]) => {
                if (amount === 0) return null;
                const config = RESOURCE_ICONS[resource as Resource['type']];
                const Icon = config.icon;
                return (
                  <button
                    key={resource}
                    onClick={() => sellResource(resource as Resource['type'], Math.floor(amount), 10)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 rounded-lg p-3 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <span className="text-white font-semibold capitalize">{resource}</span>
                    </div>
                    <span className="text-white">Vendre ({Math.floor(amount)})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Modal */}
      {showMarket && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-auto p-6 border border-blue-500/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">🛒 Marketplace</h2>
              <button
                onClick={() => setShowMarket(false)}
                className="text-white hover:text-red-400 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {marketListings.map(listing => {
                const config = RESOURCE_ICONS[listing.resource];
                const Icon = config.icon;
                return (
                  <div key={listing.id} className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${config.bg} p-3 rounded-lg border border-white/20`}>
                        <Icon className={`w-8 h-8 ${config.color}`} />
                      </div>
                      <div>
                        <div className="text-white font-bold capitalize text-lg">{listing.resource}</div>
                        <div className="text-gray-300 text-sm">Vendeur: {listing.seller}</div>
                        <div className="text-gray-400 text-xs">
                          {listing.amount} unités × {listing.pricePerUnit} ECOR
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => buyFromMarket(listing)}
                      disabled={ecor < listing.totalPrice}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:cursor-not-allowed"
                    >
                      Acheter {listing.totalPrice} ECOR
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}