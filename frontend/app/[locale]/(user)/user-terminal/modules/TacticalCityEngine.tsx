// Extrait de TacticalCityEngine.tsx
export default function TacticalCityEngine() {
  return (
    <group>
      {/* 1. GRILLE TACTIQUE (Nette et subtile) */}
      <gridHelper 
        args={[100, 100, "#06b6d4", "#020617"]} 
        position={[0, 0, 0]} 
        rotation={[0, 0, 0]}
      />

      {/* 2. SOL NOIR PROFOND (Supprime l'effet gris pixelisé) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial 
          color="#010204" 
          roughness={1} 
          metalness={0.1} 
        />
      </mesh>

      {/* 3. EFFET DE LUMIÈRE RASANTE (Donne du relief aux rues) */}
      <pointLight position={[0, 2, 0]} intensity={0.5} color="#06b6d4" distance={50} />
    </group>
  );
}