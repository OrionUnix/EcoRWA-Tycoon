/**
 * GameWidgets — Barrel file
 *
 * Ce fichier re-exporte tous les widgets du jeu.
 * Chaque composant est défini dans son propre fichier dans ./widgets/.
 * Importer depuis ce barrel maintient la compatibilité avec le code existant.
 */

// ─── Constants & Helpers ──────────────────────────────────────────────────────
// ─── Constants & Helpers ──────────────────────────────────────────────────────
export { ROADS, LAYERS, formatNumber } from '../widgets/helpers';

// ─── UI Components ────────────────────────────────────────────────────────────
export { ToolButton } from '../widgets/ToolButton';
export { ResourceItem } from '../widgets/ResourceItem';
export { ResourceCard } from '../widgets/ResourceCard';
export { NeedsDisplay } from '../widgets/NeedsDisplay';
export { GameTooltip } from '../widgets/GameTooltip';