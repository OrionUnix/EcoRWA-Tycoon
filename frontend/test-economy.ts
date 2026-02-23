import { MapEngine } from './app/[locale]/(user)/user-terminal/engine/MapEngine';
import { ZoneManager } from './app/[locale]/(user)/user-terminal/engine/ZoneManager';
import { EconomySystem } from './app/[locale]/(user)/user-terminal/engine/systems/EconomySystem';
import { ZoneType } from './app/[locale]/(user)/user-terminal/engine/types';

console.log("Creating Map...");
const map = new MapEngine();

console.log("Before zoning:");
EconomySystem.update(map);

// Simulate placing a road and a zone
map.roadLayer[0] = { type: 'SMALL' } as any;
console.log("Placing residential zone at index 1...");
const result = ZoneManager.placeZone(map, 1, ZoneType.RESIDENTIAL);
console.log("Zone place result:", result);

console.log("After zoning:");
EconomySystem.update(map);
