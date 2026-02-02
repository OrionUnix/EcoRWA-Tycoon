'use client';

import { useState, useEffect } from 'react';

export interface AssetPackBuilding {
    id: number;
    buildingTypeId: string;
    category: number;
    name: { fr: string; en: string };
    visual: {
        model3D: string;
        thumbnail: string;
        baseColor: string;
    };
    economics: {
        price: number;
        yieldPercentage: number;
        maintenanceCost: number;
    };
    metadata: {
        size: number;
        isMintable: boolean;
    };
}

export interface AssetPack {
    packId: string;
    version: string;
    buildings: AssetPackBuilding[];
}

export function useAssetPacks() {
    const [assetPacks, setAssetPacks] = useState<AssetPack[]>([]);
    const [buildingsMap, setBuildingsMap] = useState<Map<number, AssetPackBuilding>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function loadAssetPacks() {
            try {
                setLoading(true);

                // Charger le pack core-buildings
                const response = await fetch('/data/asset-packs/core-buildings.json');
                if (!response.ok) {
                    // Fallback: Utiliser les données existantes de buildings.ts
                    console.warn('Asset pack not found, using fallback data');
                    const fallbackPack = createFallbackPack();
                    setAssetPacks([fallbackPack]);

                    const map = new Map<number, AssetPackBuilding>();
                    fallbackPack.buildings.forEach(building => {
                        map.set(building.id, building);
                    });
                    setBuildingsMap(map);
                    setLoading(false);
                    return;
                }

                const pack: AssetPack = await response.json();
                setAssetPacks([pack]);

                // Créer un Map pour accès rapide par ID
                const map = new Map<number, AssetPackBuilding>();
                pack.buildings.forEach(building => {
                    map.set(building.id, building);
                });
                setBuildingsMap(map);

                setLoading(false);
            } catch (err) {
                console.error('Failed to load asset packs:', err);

                // Utiliser fallback au lieu de crash
                const fallbackPack = createFallbackPack();
                setAssetPacks([fallbackPack]);

                const map = new Map<number, AssetPackBuilding>();
                fallbackPack.buildings.forEach(building => {
                    map.set(building.id, building);
                });
                setBuildingsMap(map);

                setError(err as Error);
                setLoading(false);
            }
        }

        loadAssetPacks();
    }, []);

    return {
        assetPacks,
        buildingsMap,
        loading,
        error,
        getBuilding: (id: number) => buildingsMap.get(id),
        getBuildingsByCategory: (category: number) =>
            Array.from(buildingsMap.values()).filter(b => b.category === category)
    };
}

// Fallback data si le JSON n'est pas trouvé
function createFallbackPack(): AssetPack {
    return {
        packId: 'core-buildings-fallback',
        version: '1.0.0',
        buildings: [
            {
                id: 1,
                buildingTypeId: 'loft-saint-germain',
                category: 1,
                name: { fr: 'Loft Saint-Germain', en: 'Saint-Germain Loft' },
                visual: {
                    model3D: '/models/loft.glb',
                    thumbnail: '/assets/buildings/Loft_Saint-Germain.png',
                    baseColor: '#4A90E2'
                },
                economics: {
                    price: 150000000,
                    yieldPercentage: 420,
                    maintenanceCost: 500000
                },
                metadata: { size: 5, isMintable: true }
            },
            {
                id: 2,
                buildingTypeId: 'bistrot-central',
                category: 2,
                name: { fr: 'Le Bistrot Central', en: 'Central Bistro' },
                visual: {
                    model3D: '/models/bistrot.glb',
                    thumbnail: '/assets/buildings/bistro.png',
                    baseColor: '#FF6B35'
                },
                economics: {
                    price: 100000000,
                    yieldPercentage: 780,
                    maintenanceCost: 800000
                },
                metadata: { size: 4, isMintable: true }
            },
            {
                id: 3,
                buildingTypeId: 'eco-tower-2030',
                category: 3,
                name: { fr: 'Eco-Tower 2030', en: 'Eco-Tower 2030' },
                visual: {
                    model3D: '/models/ecotower.glb',
                    thumbnail: '/assets/buildings/EcoTower_2030.png',
                    baseColor: '#10B981'
                },
                economics: {
                    price: 250000000,
                    yieldPercentage: 650,
                    maintenanceCost: 1200000
                },
                metadata: { size: 7, isMintable: true }
            }
        ]
    };
}
