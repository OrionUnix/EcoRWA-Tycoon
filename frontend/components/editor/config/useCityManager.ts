import { useState, useCallback } from 'react';
import * as THREE from 'three';

export function useCityManager() {
    const ROAD_GRID = 2;
    const RIVER_GRID = 1;

    const [roadNetwork, setRoadNetwork] = useState<Map<string, { x: number, z: number }>>(new Map());
    const [riverNetwork, setRiverNetwork] = useState<Map<string, { x: number, z: number }>>(new Map());
    const [zones, setZones] = useState<Map<string, { x: number, z: number, type: string }>>(new Map());
    const [props, setProps] = useState<Map<string, { x: number, z: number, type: string, model: string }>>(new Map());

    // Utilitaire pour vérifier si une route est à côté (indispensable pour les zones)
    const hasAdjacentRoad = useCallback((x: number, z: number, roads: Map<string, any>) => {
        return (
            roads.has(`${x},${z - ROAD_GRID}`) ||
            roads.has(`${x},${z + ROAD_GRID}`) ||
            roads.has(`${x + ROAD_GRID},${z}`) ||
            roads.has(`${x - ROAD_GRID},${z}`)
        );
    }, [ROAD_GRID]);

    const getPointsOnLine = useCallback((start: THREE.Vector3, end: THREE.Vector3, size: number) => {
        const points: { x: number, z: number }[] = [];
        const sX = Math.round(start.x / size) * size;
        const sZ = Math.round(start.z / size) * size;
        const eX = Math.round(end.x / size) * size;
        const eZ = Math.round(end.z / size) * size;

        const diffX = eX - sX;
        const diffZ = eZ - sZ;

        if (Math.abs(diffX) > Math.abs(diffZ)) {
            const steps = Math.abs(diffX) / size;
            for (let i = 0; i <= steps; i++) {
                points.push({ x: sX + (Math.sign(diffX) * i * size), z: sZ });
            }
        } else {
            const steps = Math.abs(diffZ) / size;
            for (let i = 0; i <= steps; i++) {
                points.push({ x: sX, z: sZ + (Math.sign(diffZ) * i * size) });
            }
        }
        return points;
    }, []);

    const updateCity = useCallback((points: { x: number, z: number }[], mode: string | null) => {
        if (!mode) return;

        const newRoads = new Map(roadNetwork);
        const newRivers = new Map(riverNetwork);
        const newZones = new Map(zones);
        const newProps = new Map(props);

        points.forEach(p => {
            const key = `${p.x},${p.z}`;

            if (mode === 'DELETE') {
                newRoads.delete(key);
                newRivers.delete(key);
                newZones.delete(key);
                newProps.delete(key);
            } 
            else if (mode === 'ROAD') {
                newRoads.set(key, { x: p.x, z: p.z });
                newZones.delete(key);
                newRivers.delete(key);
                // Nettoyage de la nature sur l'emprise de la route (2x2)
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        newProps.delete(`${p.x + dx},${p.z + dz}`);
                    }
                }
            } 
            else if (mode === 'WATER') {
                newRivers.set(key, { x: p.x, z: p.z });
                newRoads.delete(key);
                newZones.delete(key);
                newProps.delete(key);
            } 
            else if (mode.startsWith('NATURE:')) {
                const modelName = mode.split(':')[1];
                const roadKey = `${Math.round(p.x / ROAD_GRID) * ROAD_GRID},${Math.round(p.z / ROAD_GRID) * ROAD_GRID}`;
                
                if (!newRoads.has(roadKey) && !newRivers.has(key) && !newZones.has(roadKey)) {
                    newProps.set(key, { x: p.x, z: p.z, type: 'NATURE', model: modelName });
                }
            }
            else if (['RES', 'COM', 'IND'].includes(mode)) {
                if (!newRoads.has(key) && !newRivers.has(key) && hasAdjacentRoad(p.x, p.z, newRoads)) {
                    newZones.set(key, { x: p.x, z: p.z, type: mode });
                    // NETTOYAGE : On rase la nature sous le bâtiment
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dz = -1; dz <= 1; dz++) {
                            newProps.delete(`${p.x + dx},${p.z + dz}`);
                        }
                    }
                }
            }
        });

        setRoadNetwork(newRoads);
        setRiverNetwork(newRivers);
        setZones(newZones);
        setProps(newProps);
    }, [roadNetwork, riverNetwork, zones, props, hasAdjacentRoad]);

    return {
        roadNetwork, riverNetwork, zones, props,
        updateCity, getPointsOnLine,
        ROAD_GRID, RIVER_GRID
    };
}