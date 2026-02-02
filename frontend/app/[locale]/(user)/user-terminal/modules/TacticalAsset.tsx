// app/[locale]/(user)/user-terminal/modules/TacticalAsset.tsx
'use client';

import { Float, Html } from '@react-three/drei';
import { useState } from 'react';

export function TacticalAsset({ position, color, label, onClick, isActive }: any) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <Float speed={isActive ? 4 : 1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.8, hovered || isActive ? 2.5 : 2, 0.8]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={hovered || isActive ? 5 : 1} 
            wireframe 
            transparent
            opacity={0.8}
          />
        </mesh>
      </Float>

      {/* Label dynamique */}
      {(hovered || isActive) && (
        <Html distanceFactor={15} position={[0, 3, 0]} center>
          <div className="px-2 py-1 bg-black/90 border border-white/20 text-[10px] text-white font-mono whitespace-nowrap animate-in fade-in zoom-in duration-200">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}