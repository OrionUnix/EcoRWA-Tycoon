# Analysis of "Staircase Effect" in Isometric Tilemap rendering

## The Issue
Visually, the terrain looks like "stairs" or has gaps/overlaps that break the illusion of a continuous surface. This happens when `TerrainTilemap` was introduced.

## The Explanation

### 1. Anchor Point Misalignment
In isometric rendering, the "anchor point" (the pixel coordinate that corresponds to the logical (x,y) grid position) is critical.
- **Logical Center**: The code calculates `pos = gridToScreen(x, y)`. This returns the center of the isometric diamond flat on the ground (z=0).
- **Sprite Center**: `TerrainTilemap` uses `ANCHOR_Y = 0.5`. This puts the logical center *in the middle of the sprite image*.
- **The Problem**: 
  - If your sprite represents a flat tile (like a carpet), Center-Center is fine.
  - If your sprite represents a **block** with height (a cube or extrusion), the "feet" of the block should be at the logical center, not the middle of the image. 
  - If you anchor the middle, the block sinks into the ground by half its height.
  - Since tiles are drawn Back-to-Front, a tile drawn "in front" (lower on screen) that is sunk into the ground will unintentionally cover the top of the tile behind it, or expose gaps if the sprites are too short.

### 2. Water Depth Offset
The code has:
```typescript
if (biome === OCEAN) depthOffset = 4;
```
This shifts water sprites down by 4 pixels.
- If land tiles are anchored at 0, and water tiles are anchored at +4, you create a visual cliff.
- If the land tile sprite doesn't extend far enough down (the "skirt"), you will see a gap between the bottom of the land tile and the top of the water tile. This gap shows the black background.

## The Solution (Hypothesis)

1. **Adjust Anchor Y**: Move the anchor point down. Instead of `0.5` (middle), try `0.75` or `0.85` (near bottom). This lifts the sprite up relative to the grid point, making it stand "on top" of the grid rather than floating in it.
2. **Remove or Adjust Water Offset**: If the terrain is meant to be flat, remove the `depthOffset`. If distinct layers are needed, ensure the sprites are tall enough to overlap.

## How to Verify
Use the provided `DebugTerrainTilemap.ts`.
- **Red Diamond**: Where the tile *should* be logically.
- **Blue Box**: Where the image *is* being drawn.
- **Yellow Dot**: The anchor point on the image.

If the Yellow Dot is significantly above the "bottom face" of your block sprite, the sprite is sinking. Move the anchor Y up (higher value).
