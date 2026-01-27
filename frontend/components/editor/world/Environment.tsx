// src/components/editor/world/Environment.tsx
import { useRef, useMemo } from 'react'; // Ajout de useMemo ici
import * as THREE from 'three';

interface EnvironmentProps {
    isNight: boolean;
}

export default function Environment({ isNight }: EnvironmentProps) {
    const sunRef = useRef<THREE.DirectionalLight>(null!);

    // useMemo permet de ne pas recalculer ces valeurs à chaque micro-mouvement de souris
    const config = useMemo(() => ({
        sunIntensity: isNight ? 0.05 : 3.5, // Un tout petit peu de lune la nuit
        sunColor: isNight ? '#2e4482' : '#fff5e6',
        ambientIntensity: isNight ? 0.02 : 0.15, 
        skyColor: isNight ? '#020617' : '#cbd5e1'
    }), [isNight]); // On ne recalcule QUE si isNight change

    return (
        <>
            {/* Couleur du fond */}
            <color attach="background" args={[config.skyColor]} />
            
            {/* Lumière ambiante */}
            <ambientLight intensity={config.ambientIntensity} />

            {/* Le Soleil / La Lune */}
            <directionalLight
                ref={sunRef}
                position={[100, 150, 100]}
                intensity={config.sunIntensity}
                color={config.sunColor}
                castShadow
                // Optimisation des ombres pour la performance
                shadow-mapSize={[1024, 1024]} // Réduit de 2048 à 1024 pour gagner en fluidité
                shadow-camera-left={-100}
                shadow-camera-right={100}
                shadow-camera-top={100}
                shadow-camera-bottom={-100}
                shadow-bias={-0.0001}
            />

            {isNight && (
                <hemisphereLight args={['#1a237e', '#000000', 0.1]} />
            )}
        </>
    );
}