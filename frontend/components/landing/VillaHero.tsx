'use client';
import { Float, ContactShadows } from '@react-three/drei';

export default function VillaHero() {
  return (
    <group scale={0.8} rotation={[0, -Math.PI / 4, 0]}>
      <group>
        {/* NIVEAU 1 : SOCLE */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[10, 0.5, 8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>

        {/* PISCINE (Version simplifiée) */}
        <mesh position={[2.5, 0.26, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4, 5]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} />
        </mesh>

        {/* NIVEAU 2 : BLOC VITRÉ */}
        <group position={[-2, 1.75, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[5, 3, 6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          {/* Fenêtre simplifiée */}
          <mesh position={[0, 0, 3.01]}>
            <planeGeometry args={[4.5, 2.5]} />
            <meshStandardMaterial color="#3b82f6" transparent opacity={0.2} />
          </mesh>
        </group>

        {/* NIVEAU 3 : ÉTAGE SUPÉRIEUR */}
        <group position={[1, 3.5, -1]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6, 1.5, 4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      </group>

      <ContactShadows position={[0, -0.3, 0]} opacity={0.4} scale={20} blur={2.5} far={4} />
    </group>
  );
}