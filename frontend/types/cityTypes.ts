/**
 * Types et interfaces pour la ville 3D Parse City
 * Architecture modulaire - Ne pas modifier sans impact analysis
 */

// --- Types de Zones ---
export type ZoneType = 'downtown' | 'residential' | 'commercial' | 'industrial';

// --- Position 3D ---
export interface Position3D {
    x: number;
    y: number;
    z: number;
}

// --- Rotation 3D ---
export interface Rotation3D {
    x?: number;
    y?: number;
    z?: number;
}

// --- Configuration d'un modèle 3D ---
export interface Model3DConfig {
    path: string;           // Chemin vers le fichier GLB
    scale?: number;         // Échelle (défaut: 1)
    rotation?: Rotation3D;  // Rotation en radians
}

// --- Bâtiment 3D ---
export interface Building3D {
    id: string;
    name: string;
    type: { fr: string; en: string };
    typeColor: string;
    zone: ZoneType;
    position: Position3D;
    model: Model3DConfig;
    // Données RWA
    yield?: string;
    price?: string;
    pluAlert?: { fr: string; en: string };
    aiReport?: AIReport;
    owned?: boolean;
    isMintable?: boolean;
}

// --- Rapport IA (conservé de l'existant) ---
export interface AIReport {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    opportunities: { fr: string[]; en: string[] };
    risks: { fr: string[]; en: string[] };
}

// --- Configuration Route ---
export interface Road3D {
    id: string;
    type: RoadType;
    position: Position3D;
    rotation?: Rotation3D;
}

export type RoadType =
    | 'straight'
    | 'bend'
    | 'intersection'
    | 'crossroad'
    | 'end'
    | 'curve';

// --- Décoration ---
export interface Decoration3D {
    id: string;
    type: DecorationType;
    position: Position3D;
    rotation?: Rotation3D;
    scale?: number;
}

export type DecorationType =
    | 'tree-large'
    | 'tree-small'
    | 'light-square'
    | 'light-curved'
    | 'fence'
    | 'planter';

// --- Configuration d'une Zone ---
export interface ZoneConfig {
    type: ZoneType;
    buildings: Building3D[];
    roads: Road3D[];
    decorations: Decoration3D[];
    position: Position3D;  // Position de base de la zone
}

// --- Layout complet de la ville ---
export interface CityLayout {
    name: string;
    gridSize: number;
    zones: ZoneConfig[];
}

// --- Props des composants de zone ---
export interface ZoneProps {
    position?: [number, number, number];
    onBuildingClick?: (building: Building3D) => void;
    selectedBuildingId?: string | null;
}

// --- Props du modèle GLB ---
export interface GLBModelProps {
    path: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
    onClick?: () => void;
    onHover?: (hovered: boolean) => void;
    isSelected?: boolean;
    isHovered?: boolean;
}
