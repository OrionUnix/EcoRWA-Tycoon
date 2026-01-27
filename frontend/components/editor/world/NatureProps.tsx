import React from 'react';
import GLBModel from '@/components/zones/GLBModel';
import { ZONE_TYPES } from '../config/zoneAssets';

const naturePath = ZONE_TYPES.NATURE.path;

export default function NatureProps({ props }: { props: Map<string, any> }) {
    return (
        <group>
            {Array.from(props.values()).map((prop) => {
                // Utilisation des coordonnées pour générer une rotation unique
                const rotation = (prop.x * 0.7 + prop.z * 0.3) * Math.PI;

                return (
                    <group
                        key={`${prop.x}-${prop.z}`}
                        position={[prop.x, 0, prop.z]}
                        rotation={[0, rotation, 0]}
                    >
                        <GLBModel
                            path={prop.model.endsWith('.glb') ? `${naturePath}${prop.model}` : `${naturePath}${prop.model}.glb`}
                            scale={[1, 1, 1]}
                        />
                    </group>
                );
            })}
        </group>
    );
}