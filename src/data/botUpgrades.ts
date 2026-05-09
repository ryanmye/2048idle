import type { UpgradeKind } from '../game/types'

/** Shared between bot profile and board driver panel — keep labels/effects aligned. */
export const BOT_UPGRADE_DEFS: { kind: UpgradeKind; label: string; effect: string }[] = [
  { kind: 'speed', label: 'speed', effect: '+15% moves/sec per level' },
  { kind: 'depth', label: 'look-ahead depth', effect: '+1 lookahead per level' },
  { kind: 'mergeBonus', label: 'merge bonus %', effect: '+2% merge value per level' },
  { kind: 'lucky', label: 'lucky tile', effect: '+5% chance to spawn 4 instead of 2' },
]
