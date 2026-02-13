# Debug Implant Instructions

## 1. Installation
The file `DebugTerrainTilemap.ts` is a drop-in debugging replacement for your `TerrainTilemap.ts`.

## 2. Usage
To verify the fix, swap the class in your renderer.
Open `components/GameRenderer.ts` (or wherever `TerrainTilemap` is instantiated):

```typescript
// 1. Comment out the real renderer
// import { TerrainTilemap } from './TerrainTilemap';

// 2. Import the Implant
import { DebugTerrainTilemap as TerrainTilemap } from '../implant/DebugTerrainTilemap';
```

## 3. Configuration
Open `implant/DebugTerrainTilemap.ts` and tweak the `DEBUG_CONFIG` object at the top of the file:

```typescript
static readonly DEBUG_CONFIG = {
    SHOW_WIREFRAME: true,      // Enable/Disable debug lines
    ANCHOR_Y: 0.5,             // Change this to 0.75 to see if it fixes the stairs!
    WATER_OFFSET: 4            // Change to 0 to align water
};
```

## 4. What to look for
- **Red Diamond**: The "Ground Truth" grid position.
- **Blue Box**: The actual sprite texture.
- **Staircase Effect**: If the blue boxes are misaligned vertically with the red diamonds in a way that creates gaps, adjust `ANCHOR_Y`.
