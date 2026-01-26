import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';

export default function GLBModel({ path, position, rotation, scale }: any) {
    const { scene } = useGLTF(path);

    // useMemo évite de recloner à chaque micro-rendu
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    return (
        <primitive
            object={clonedScene}
            position={position}
            rotation={rotation}
            scale={scale}
        />
    );
}