'use client';

import React from 'react';
import GLBModel from '@/components/zones/GLBModel';
import { WaterTile } from './Water';

export function WorldGrid({ mapData, onTileClick }: any) {
    return (
        <group>
            {mapData.map((tile: any, index: number) => {
                const isWater = tile.type.startsWith('river');

                return (
                    <group
                        key={`${tile.x}-${tile.z}-${index}`}
                        position={[tile.x, 0, tile.z]}
                    >
                        {/* 1. SOL DE BASE : On met de l'herbe partout pour le clic, 
                            sauf si c'est une rivière (car la rivière a ses propres bords) */}
                        {!isWater ? (
                            <group onClick={(e) => {
                                e.stopPropagation(); // Empêche le clic de traverser
                                onTileClick(tile.x, tile.z);
                            }}>
                                <GLBModel path="/assets/models/nature/ground_grass.glb" />
                            </group>
                        ) : (
                            /* 2. RIVIÈRE : On appelle le composant dédié */
                            <WaterTile
                                x={0} z={0}
                                type={tile.type}
                                rotation={tile.rotation || 0}
                            />
                        )}

                        {/* 3. DÉCORS (Arbres, etc.) posés SUR l'herbe */}
                        {tile.type === 'tree' && (
                            <group scale={0.6} position={[0, 0, 0]}>
                                <GLBModel path="/assets/models/nature/tree_oak_dark.glb" />
                            </group>
                        )}
                    </group>
                );
            })}
        </group>
    );
}