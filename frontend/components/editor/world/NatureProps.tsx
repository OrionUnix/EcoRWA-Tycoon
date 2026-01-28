import React, { useMemo, memo } from 'react';
import GLBModel from '@/components/zones/GLBModel';
import { ZONE_TYPES } from '../config/zoneAssets';

const naturePath = ZONE_TYPES.NATURE.path;

const PropInstance = memo(({ prop, modelPath }: any) => {
    const seed = Math.abs(Math.sin(prop.x * 12.9898 + prop.z * 78.233) * 43758.5453);
    const rotation = seed * Math.PI;
    const jitterX = (seed % 1 - 0.5) * 0.8;
    const jitterZ = ((seed * 1.5) % 1 - 0.5) * 0.8;
    const scale = 0.8 + (seed % 0.4);

    return (
        <group
            position={[prop.x + jitterX, 0, prop.z + jitterZ]}
            rotation={[0, rotation, 0]}
        >
            <GLBModel
                path={modelPath}
                scale={[scale, scale, scale]}
            />
        </group>
    );
});

export default function NatureProps({ props }: { props: Map<string, any> }) {
    const propList = useMemo(() => Array.from(props.values()), [props]);

    return (
        <group>
            {propList.map((prop) => {
                const modelConfig = (ZONE_TYPES.NATURE.models as any[]).find(m => m.id === prop.model);
                const fileName = modelConfig ? modelConfig.file : (prop.model.endsWith('.glb') ? prop.model : `${prop.model}.glb`);
                const fullPath = `${naturePath}${fileName}`;

                return (
                    <PropInstance
                        key={`${prop.x}-${prop.z}`}
                        prop={prop}
                        modelPath={fullPath}
                    />
                );
            })}
        </group>
    );
}