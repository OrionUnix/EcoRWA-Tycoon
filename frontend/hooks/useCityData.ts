'use client';

import { useMemo } from 'react';
import { INITIAL_CITY_LAYOUT } from '@/data/initialCityLayout';
import { useAssetPacks } from './useAssetPacks';

export interface CityZone {
    x: number;
    z: number;
    type: string;
    id: number;
    buildingId?: number;
}

export function useCityData() {
    const { buildingsMap, loading: assetPacksLoading } = useAssetPacks();

    // Filtrer les zones de la ville avec vérifications de sécurité
    const zones = useMemo(() => {
        if (buildingsMap.size === 0) return [];

        return Array.from(INITIAL_CITY_LAYOUT.zones.values()).filter(zone => {
            // Vérification de l'existence du modèle dans buildingsMap
            const buildingExists = zone.buildingId && buildingsMap.has(zone.buildingId);

            // Limite l'affichage à une zone raisonnable
            const isWithinBounds = Math.abs(zone.x) <= 30 && Math.abs(zone.z) <= 30;

            return buildingExists && isWithinBounds;
        });
    }, [buildingsMap]);

    return {
        zones,
        loading: assetPacksLoading,
        buildingsMap,
    };
}
