import * as PIXI from 'pixi.js';
import { withBasePath } from '@/app/[locale]/(user)/user-terminal/utils/assetUtils';

const BASE_PATH = withBasePath('/assets/isometric/Spritesheet/vehicles.png');

export enum VehicleType {
    CIVILIAN_CAR = 'CIVILIAN_CAR',
    CITY_BUS = 'CITY_BUS',
    GARBAGE_TRUCK = 'GARBAGE_TRUCK',
    POLICE_CRUISER = 'POLICE_CRUISER',
    AMBULANCE = 'AMBULANCE',
    FIRE_TRUCK = 'FIRE_TRUCK',
    OIL_TANKER = 'OIL_TANKER',
    FREIGHT_TRAIN = 'FREIGHT_TRAIN'
}

export enum Direction {
    UP_RIGHT = 0,
    DOWN_RIGHT = 1,
    UP_LEFT = 2,
    DOWN_LEFT = 3
}

interface VehicleMetadata {
    start_row: number;
    col_offset?: number;
    frames_per_dir: number;
}

const VEHICLE_META: Record<VehicleType, VehicleMetadata> = {
    [VehicleType.CIVILIAN_CAR]: { start_row: 0, frames_per_dir: 4 },
    [VehicleType.CITY_BUS]: { start_row: 1, frames_per_dir: 4 },
    [VehicleType.GARBAGE_TRUCK]: { start_row: 1, col_offset: 3, frames_per_dir: 4 },
    [VehicleType.POLICE_CRUISER]: { start_row: 3, frames_per_dir: 4 },
    [VehicleType.AMBULANCE]: { start_row: 2, frames_per_dir: 4 },
    [VehicleType.FIRE_TRUCK]: { start_row: 2, col_offset: 3, frames_per_dir: 4 },
    [VehicleType.OIL_TANKER]: { start_row: 4, col_offset: 2, frames_per_dir: 4 },
    [VehicleType.FREIGHT_TRAIN]: { start_row: 5, frames_per_dir: 6 }
};

export class VehicleAssets {
    private static textureCache = new Map<string, PIXI.Texture[]>();
    private static _loaded = false;
    private static spritesheet: PIXI.Texture | null = null;

    // Constants from JSON
    private static FRAME_WIDTH = 128;
    private static FRAME_HEIGHT = 128;

    static async load() {
        if (this._loaded) return;

        console.log("🚗 Loading Vehicle Assets...");
        try {
            const texture = await PIXI.Assets.load(BASE_PATH);
            texture.source.scaleMode = 'nearest'; // Pixel art style
            this.spritesheet = texture;

            // Slice textures for each type
            Object.entries(VEHICLE_META).forEach(([type, meta]) => {
                const vType = type as VehicleType;
                this.sliceVehicleTextures(vType, meta);
            });

            this._loaded = true;
            console.log("✅ Vehicle Assets loaded.");
        } catch (e) {
            console.error("❌ Failed to load vehicle assets", e);
        }
    }

    private static sliceVehicleTextures(type: VehicleType, meta: VehicleMetadata) {
        if (!this.spritesheet) return;

        const frames: PIXI.Texture[] = [];
        const startRow = meta.start_row;
        const initialCol = meta.col_offset || 0;
        const framesPerVariant = meta.frames_per_dir;

        // Handle Variants: Assuming Civ Car has 2 variants
        let variantCount = 1;
        if (type === VehicleType.CIVILIAN_CAR) variantCount = 2;

        for (let v = 0; v < variantCount; v++) {
            const variantColStart = initialCol + (v * framesPerVariant);

            for (let f = 0; f < framesPerVariant; f++) {
                const col = variantColStart + f;
                const row = startRow;

                const rect = new PIXI.Rectangle(
                    col * this.FRAME_WIDTH,
                    row * this.FRAME_HEIGHT,
                    this.FRAME_WIDTH,
                    this.FRAME_HEIGHT
                );

                const tex = new PIXI.Texture({
                    source: this.spritesheet.source,
                    frame: rect
                });
                frames.push(tex);
            }
        }
        this.textureCache.set(type, frames);
    }

    static getTexture(type: VehicleType, direction: number, frameIndex: number, variant: number = 0): PIXI.Texture | null {
        const frames = this.textureCache.get(type);
        if (!frames) return null;

        const meta = VEHICLE_META[type];
        if (!meta) return null;

        const framesPerVariant = meta.frames_per_dir;

        // Calculate offset for variant
        const variantOffset = variant * framesPerVariant;

        // Map direction to index
        // We assume the frames in the array are ordered: [Dir0, Dir1, Dir2, Dir3]
        // But if framesPerVariant is 4, it means we have 4 frames.
        // Direct mapping: 
        let dirIndex = direction % framesPerVariant;

        const index = variantOffset + dirIndex;

        return frames[index] || frames[0];
    }

    static clear() {
        this.textureCache.forEach(frames => frames.forEach(t => t.destroy(true)));
        this.textureCache.clear();
        this._loaded = false;
        if (this.spritesheet) {
            this.spritesheet.destroy(true);
            this.spritesheet = null;
        }
    }
}
