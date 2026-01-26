'use client';

/**
 * CHARGEUR DE VILLE DEPUIS JSON
 * Charge une ville créée avec l'éditeur
 */

import { useState, useEffect } from 'react';
import GLBModel from './GLBModel';
import { ROAD_MODELS, COMMERCIAL_MODELS, SUBURBAN_MODELS, INDUSTRIAL_MODELS } from '@/lib/city3d/modelUtils';

interface PlacedObject {
    id: string;
    type: 'road' | 'building' | 'decoration';
    modelKey: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
}

interface CityFromJSONProps {
    jsonPath?: string;           // Chemin vers le fichier JSON
    jsonData?: PlacedObject[];   // Ou données directes
    onLoad?: (objects: PlacedObject[]) => void;
}

export default function CityFromJSON({
    jsonPath,
    jsonData,
    onLoad,
}: CityFromJSONProps) {
    const [objects, setObjects] = useState<PlacedObject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Si données directes fournies
        if (jsonData) {
            setObjects(jsonData);
            setLoading(false);
            onLoad?.(jsonData);
            console.log('✓ Ville chargée (données directes):', jsonData.length, 'objets');
            return;
        }

        // Sinon charger depuis le fichier
        if (jsonPath) {
            setLoading(true);
            fetch(jsonPath)
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`Fichier non trouvé: ${jsonPath}`);
                    }
                    return res.json();
                })
                .then(data => {
                    setObjects(data);
                    setLoading(false);
                    onLoad?.(data);
                    console.log('✓ Ville chargée depuis:', jsonPath);
                    console.log('  - Routes:', data.filter((o: PlacedObject) => o.type === 'road').length);
                    console.log('  - Bâtiments:', data.filter((o: PlacedObject) => o.type === 'building').length);
                    console.log('  - Décorations:', data.filter((o: PlacedObject) => o.type === 'decoration').length);
                    console.log('  - Total:', data.length, 'objets');
                })
                .catch(err => {
                    console.error('✗ Erreur de chargement:', err);
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [jsonPath, jsonData, onLoad]);

    // Obtenir le chemin du modèle
    const getModelPath = (obj: PlacedObject): string => {
        const allModels = {
            ...ROAD_MODELS,
            ...COMMERCIAL_MODELS,
            ...SUBURBAN_MODELS,
            ...INDUSTRIAL_MODELS,
        } as Record<string, string>;

        const path = allModels[obj.modelKey];

        if (!path) {
            console.warn(`⚠️ Modèle non trouvé: ${obj.modelKey}`);
            // Fallback vers un modèle par défaut
            if (obj.type === 'road') return ROAD_MODELS['straight'];
            if (obj.type === 'building') return COMMERCIAL_MODELS['building-a'];
            return SUBURBAN_MODELS['tree-large'];
        }

        return path;
    };

    if (loading) {
        return null; // Ou un loader
    }

    if (error) {
        console.error('Erreur CityFromJSON:', error);
        return null;
    }

    return (
        <group>
            {objects.map((obj) => {
                const modelPath = getModelPath(obj);

                return (
                    <GLBModel
                        key={obj.id}
                        path={modelPath}
                        position={obj.position}
                        rotation={obj.rotation}
                        scale={obj.scale}
                    />
                );
            })}
        </group>
    );
}

/**
 * EXEMPLE D'UTILISATION
 * 
 * 1. Depuis un fichier JSON dans public/
 * 
 *    <CityFromJSON jsonPath="/data/my-city.json" />
 * 
 * 2. Depuis des données chargées
 * 
 *    const [cityData, setCityData] = useState([]);
 *    <CityFromJSON jsonData={cityData} />
 * 
 * 3. Avec callback
 * 
 *    <CityFromJSON 
 *        jsonPath="/data/my-city.json"
 *        onLoad={(objects) => console.log('Chargé!', objects)}
 *    />
 */