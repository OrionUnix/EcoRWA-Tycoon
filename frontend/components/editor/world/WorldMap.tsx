// src/components/world/WorldMap.tsx
import { Instances, Instance } from '@react-three/drei';

export function WorldMap({ size = 50 }) {
  // On crée une grille de données simple
  const grid = useMemo(() => {
    const data = [];
    for (let x = -size; x < size; x++) {
      for (let z = -size; z < size; z++) {
        // Logique procédurale : au centre une rivière, ailleurs de l'herbe
        const type = Math.abs(x) < 2 ? 'river' : 'grass';
        data.push({ x, z, type });
      }
    }
    return data;
  }, [size]);

  return (
    <group>
       {/* On utilise des Instances pour l'herbe (très performant) */}
       <GrassInstances data={grid.filter(d => d.type === 'grass')} />
       
       {/* Les éléments spéciaux (rivières) peuvent être posés normalement */}
       <RiverTiles data={grid.filter(d => d.type === 'river')} />
    </group>
  );
}