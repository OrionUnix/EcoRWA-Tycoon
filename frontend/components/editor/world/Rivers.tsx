'use client';

import React from 'react';
import GLBModel from '@/components/zones/GLBModel';

const ASSETS = {
    STRAIGHT: "/assets/models/nature/ground_riverStraight.glb",
    BEND: "/assets/models/nature/ground_riverBend.glb",
    T_JUNCTION: "/assets/models/nature/ground_riverSplit.glb",
    CROSSROAD: "/assets/models/nature/ground_riverCross.glb",
    END: "/assets/models/nature/ground_riverEndClosed.glb",
    TILE: "/assets/models/nature/ground_riverTile.glb"
};

export default function Rivers({ riverNetwork, previewPoints, mode, gridSize = 1 }: any) {
    
    const getRiverConfig = (x: number, z: number) => {
        // On utilise gridSize pour vérifier les voisins exacts
        const n = riverNetwork.has(`${x},${z - gridSize}`);
        const s = riverNetwork.has(`${x},${z + gridSize}`);
        const e = riverNetwork.has(`${x + gridSize},${z}`);
        const w = riverNetwork.has(`${x - gridSize},${z}`);

        const count = [n, s, e, w].filter(Boolean).length;
        let path = ASSETS.TILE;
        let rot = 0;

        // 1. AUCUN VOISIN ou CAS PAR DÉFAUT
        if (count === 0) return { path: ASSETS.TILE, rot: 0 };

        // 2. CROIX
        if (count === 4) {
            return { path: ASSETS.CROSSROAD, rot: 0 };
        }

        // 3. INTERSECTIONS EN T (3 voisins)
        if (count === 3) {
            path = ASSETS.T_JUNCTION;
            if (!n) rot = 0;             // T pointe vers le Sud
            else if (!e) rot = -Math.PI / 2;  // ok
            else if (!s) rot = Math.PI;      // T pointe vers le Nord
            else if (!w) rot = Math.PI / 2; // ok
            return { path, rot };
        }

        // 4. VIRAGES ET LIGNES DROITES (2 voisins)
        if (count === 2) {
            if (n && s) return { path: ASSETS.STRAIGHT, rot: 0 };
            if (e && w) return { path: ASSETS.STRAIGHT, rot: Math.PI / 2 };
            
            if (s && e) return { path: ASSETS.BEND, rot: 0 };
            if (s && w) return { path: ASSETS.BEND, rot: -Math.PI / 2 };
            if (n && w) return { path: ASSETS.BEND, rot: Math.PI };
            if (n && e) return { path: ASSETS.BEND, rot: Math.PI / 2 };
        }

        // 5. TERMINAISONS (1 voisin)
        if (count === 1) {
            path = ASSETS.END;
            if (n) rot = Math.PI;
            else if (s) rot = 0;
            else if (e) rot = Math.PI / 2;
            else if (w) rot = -Math.PI / 2;
            return { path, rot };
        }

        return { path: ASSETS.TILE, rot: 0 };
    };

    // Fusionner le réseau réel et la preview pour un rendu en temps réel
    const fullNetwork = new Map(riverNetwork);
    if (previewPoints) {
        previewPoints.forEach((p: any) => fullNetwork.set(`${p.x},${p.z}`, p));
    }

    return (
        <group>
            {Array.from(fullNetwork.values()).map((r: any) => {
                const { path, rot } = getRiverConfig(r.x, r.z);
                return (
                    <group key={`${r.x}-${r.z}`} position={[r.x, 0, r.z]} rotation={[0, rot, 0]}>
                        <GLBModel path={path} scale={[1, 1, 1]} />
                    </group>
                );
            })}
        </group>
    );
}