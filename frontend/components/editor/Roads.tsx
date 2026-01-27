import React from 'react';
import GLBModel from '@/components/zones/GLBModel';
import { ZONE_TYPES } from './config/zoneAssets';

const roadConfig = ZONE_TYPES.INFRASTRUCTURE.roads;
const roadPath = roadConfig.path;

const ASSETS = {
  STRAIGHT: `${roadPath}${roadConfig.models.straight}`,
  BEND: `${roadPath}${roadConfig.models.bend}`,
  T_JUNCTION: `${roadPath}${roadConfig.models.t_junction}`,
  CROSSROAD: `${roadPath}${roadConfig.models.cross}`,
  END: `${roadPath}${roadConfig.models.end}`,
  CROSSING: `${roadPath}${roadConfig.models.crossing}`,
  LIGHT: `${roadPath}${roadConfig.models.light}`,
  CONE: `${roadPath}${roadConfig.models.cone}`
};

interface RoadsProps {
  roadNetwork: Map<string, { x: number, z: number }>;
  previewPoints: { x: number, z: number }[];
  mode: string | null;
  gridSize: number;
  isNight: boolean;
}

export default function Roads({ roadNetwork, previewPoints, mode, gridSize, isNight }: RoadsProps) {

  const getRoadConfig = (x: number, z: number) => {
    const n = roadNetwork.has(`${x},${z - gridSize}`);
    const s = roadNetwork.has(`${x},${z + gridSize}`);
    const e = roadNetwork.has(`${x + gridSize},${z}`);
    const w = roadNetwork.has(`${x - gridSize},${z}`);

    const neighborsCount = [n, s, e, w].filter(Boolean).length;
    let path = ASSETS.STRAIGHT;
    let rot = 0;
    let deco: 'LIGHT' | 'CONE' | null = null;

    if (neighborsCount === 1) {
      path = ASSETS.END;
      if (n) rot = Math.PI / 2;
      if (w) rot = Math.PI;
      if (s) rot = -Math.PI / 2;
      if (e) rot = 0;
      deco = 'CONE';
    } else if (n && s && e && w) {
      path = ASSETS.CROSSROAD;
    } else if (w && e && s) { path = ASSETS.T_JUNCTION; rot = 0; }
    else if (w && e && n) { path = ASSETS.T_JUNCTION; rot = Math.PI; }
    else if (n && s && e) { path = ASSETS.T_JUNCTION; rot = Math.PI / 2; }
    else if (n && s && w) { path = ASSETS.T_JUNCTION; rot = -Math.PI / 2; }
    else if (s && e) { path = ASSETS.BEND; rot = Math.PI / 2; }
    else if (s && w) { path = ASSETS.BEND; rot = 0; }
    else if (n && w) { path = ASSETS.BEND; rot = -Math.PI / 2; }
    else if (n && e) { path = ASSETS.BEND; rot = Math.PI; }
    else {
      const isCrossing = Math.abs((x + z) / gridSize) % 6 === 0;
      path = isCrossing ? ASSETS.CROSSING : ASSETS.STRAIGHT;
      rot = (e || w) ? 0 : Math.PI / 2;
      if (!isCrossing && Math.abs(x + z) % 10 === 0) deco = 'LIGHT';
    }

    return { path, rot, deco };
  };

  return (
    <group>
      {/* 1. RENDU DES ROUTES EXISTANTES */}
      {Array.from(roadNetwork.values()).map((r) => {
        const config = getRoadConfig(r.x, r.z);
        const isHorizontal = config.rot === 0 || config.rot === Math.PI;

        return (
          <group key={`${r.x},${r.z}`}>
            <GLBModel path={config.path} position={[r.x, 0, r.z]} rotation={[0, config.rot, 0]} scale={[2, 2, 2]} />

            {config.deco === 'LIGHT' && (
              <group>
                <GLBModel
                  path={ASSETS.LIGHT}
                  position={[isHorizontal ? r.x : r.x + 0.75, 0, isHorizontal ? r.z + 0.75 : r.z]}
                  rotation={[0, isHorizontal ? 0 : Math.PI / 2, 0]}
                  scale={[2, 2, 2]}
                />
                {isNight && (
                  <pointLight
                    position={[
                      // Si horizontal, on décale sur l'axe Z, sinon sur l'axe X
                      isHorizontal ? r.x : r.x + 0.0,
                      1.1, // On baisse un peu la hauteur pour être SOUS la lanterne
                      isHorizontal ? r.z + 0.1 : r.z
                    ]}
                    intensity={10}
                    distance={5}
                    color="#ff9933"
                    decay={2}
                  />
                )}
              </group>
            )}

            {config.deco === 'CONE' && (
              <GLBModel path={ASSETS.CONE} position={[r.x, 0, r.z]} scale={[2, 2, 2]} />
            )}
          </group>
        );
      })}

      {/* 2. PREVIEW LORS DU DRAG (Nécessaire pour construire) */}
      {previewPoints.map((p, i) => (
        <group key={`preview-${i}`}>
          {mode === 'ROAD' ? (
            <GLBModel
              path={ASSETS.STRAIGHT}
              position={[p.x, 0.05, p.z]}
              rotation={[0, previewPoints.length > 1 && previewPoints[0].x !== previewPoints[1].x ? 0 : Math.PI / 2, 0]}
              scale={[2, 2, 2]}
              opacity={0.5}
            />
          ) : mode === 'REMOVE' ? (
            <mesh position={[p.x, 0.1, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.9, 1.9]} />
              <meshStandardMaterial color="#ff4444" transparent opacity={0.6} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}