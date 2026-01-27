import React from 'react';
import GLBModel from '@/components/zones/GLBModel';
import { ZONE_TYPES } from '../config/zoneAssets';

const naturePath = ZONE_TYPES.NATURE.path;

export default function NatureProps({ props }: { props: Map<string, any> }) {
    return (
        <group>
            {Array.from(props.values()).map((prop) => {
                // Utilisation des coordonnées pour générer des variations uniques
                const seed = Math.abs(Math.sin(prop.x * 12.9898 + prop.z * 78.233) * 43758.5453);
                const rotation = seed * Math.PI;
                const jitterX = (seed % 1 - 0.5) * 0.8;
                const jitterZ = ((seed * 1.5) % 1 - 0.5) * 0.8;
                const scale = 0.8 + (seed % 0.4);

                // Recherche du modèle dans la configuration centralisée
                const modelConfig = (ZONE_TYPES.NATURE.models as any[]).find(m => m.id === prop.model);
                const fileName = modelConfig ? modelConfig.file : (prop.model.endsWith('.glb') ? prop.model : `${prop.model}.glb`);

                return (
                    <group
                        key={`${prop.x}-${prop.z}`}
                        position={[prop.x + jitterX, 0, prop.z + jitterZ]}
                        rotation={[0, rotation, 0]}
                    >
                        <GLBModel
                            path={`${naturePath}${fileName}`}
                            scale={[scale, scale, scale]}
                        />
                    </group>
                );
            })}
        </group>
    );
}