import type { ResearchEffect } from './types'

export interface ResearchNodeDef {
  id: string
  label: string
  description: string
  ring: 1 | 2 | 3 | 4
  angle: number
  requiresPrestige: number
  parentId?: string
  effect: ResearchEffect
  color?: string
}

export const RESEARCH_NODES: ResearchNodeDef[] = [
  { id: 'speed-1', label: 'speed I', description: '+5% all bot speed', ring: 1, angle: 0, requiresPrestige: 1, effect: { type: 'add-global-bot-speed-pct', amount: 5 }, color: 'var(--color-mint)' },
  { id: 'merge-1', label: 'merge I', description: '+5% merge bonus on every bot', ring: 1, angle: 60, requiresPrestige: 1, effect: { type: 'add-merge-bonus-pct', amount: 5 }, color: 'var(--color-mint)' },
  { id: 'boards', label: '+ board', description: '+1 board slot', ring: 1, angle: 120, requiresPrestige: 1, effect: { type: 'add-board-slot', amount: 1 }, color: 'var(--color-sky)' },
  { id: 'depth-1', label: 'depth I', description: '+1 lookahead depth cap', ring: 1, angle: 180, requiresPrestige: 1, effect: { type: 'add-depth-cap', amount: 1 }, color: 'var(--color-mint)' },
  { id: 'luck-1', label: 'luck I', description: '+5% lucky-tile chance', ring: 1, angle: 240, requiresPrestige: 1, effect: { type: 'add-luck-pct', amount: 5 }, color: 'var(--color-peach)' },
  { id: 'rage-1', label: 'rage I', description: 'rage lasts 25% longer', ring: 1, angle: 300, requiresPrestige: 1, effect: { type: 'extend-rage-pct', amount: 25 }, color: 'var(--color-pink)' },

  { id: 'speed-2', label: 'speed II', description: '+10% all bot speed', ring: 2, angle: 0, requiresPrestige: 2, parentId: 'speed-1', effect: { type: 'add-global-bot-speed-pct', amount: 10 }, color: 'var(--color-mint)' },
  { id: 'fusion', label: 'fusion', description: 'unlock 3-of-a-kind fusion', ring: 2, angle: 30, requiresPrestige: 2, parentId: 'speed-1', effect: { type: 'unlock-fusion' }, color: 'var(--color-lilac)' },
  { id: 'merge-2', label: 'merge II', description: '+10% merge bonus on every bot', ring: 2, angle: 60, requiresPrestige: 2, parentId: 'merge-1', effect: { type: 'add-merge-bonus-pct', amount: 10 }, color: 'var(--color-mint)' },
  { id: 'plus-board', label: '+1 board', description: '+1 board slot', ring: 2, angle: 120, requiresPrestige: 2, parentId: 'boards', effect: { type: 'add-board-slot', amount: 1 }, color: 'var(--color-sky)' },
  { id: 'depth-2', label: 'depth II', description: '+2 lookahead depth cap', ring: 2, angle: 180, requiresPrestige: 2, parentId: 'depth-1', effect: { type: 'add-depth-cap', amount: 2 }, color: 'var(--color-mint)' },
  { id: 'expecti', label: 'expecti', description: '+5% global points', ring: 2, angle: 210, requiresPrestige: 2, parentId: 'depth-1', effect: { type: 'add-global-pts-pct', amount: 5 }, color: 'var(--color-mint)' },
  { id: 'luck-2', label: 'luck II', description: '+10% lucky-tile chance', ring: 2, angle: 240, requiresPrestige: 2, parentId: 'luck-1', effect: { type: 'add-luck-pct', amount: 10 }, color: 'var(--color-peach)' },
  { id: 'rage-2', label: 'rage II', description: 'rage lasts 50% longer', ring: 2, angle: 300, requiresPrestige: 2, parentId: 'rage-1', effect: { type: 'extend-rage-pct', amount: 50 }, color: 'var(--color-pink)' },
  { id: 'offline-plus', label: 'offline+', description: '+15% offline rate', ring: 2, angle: 330, requiresPrestige: 2, parentId: 'rage-1', effect: { type: 'add-offline-pct', amount: 15 }, color: 'var(--color-butter)' },

  { id: 'ring3-q1', label: '?', description: '???', ring: 3, angle: 30, requiresPrestige: 3, parentId: 'fusion', effect: { type: 'add-global-bot-speed-pct', amount: 15 }, color: 'var(--color-coral)' },
  { id: 'board-5', label: '5×5', description: 'unlock 5×5 boards', ring: 3, angle: 90, requiresPrestige: 7, parentId: 'plus-board', effect: { type: 'unlock-board-size', size: 5 }, color: 'var(--color-sky)' },
  { id: 'ring3-q2', label: '?', description: '???', ring: 3, angle: 150, requiresPrestige: 3, parentId: 'plus-board', effect: { type: 'add-global-pts-pct', amount: 10 }, color: 'var(--color-coral)' },
  { id: 'board-6', label: '6×6', description: 'unlock 6×6 boards', ring: 3, angle: 210, requiresPrestige: 9, parentId: 'expecti', effect: { type: 'unlock-board-size', size: 6 }, color: 'var(--color-sky)' },
  { id: 'board-7', label: '7×7', description: 'unlock 7×7 boards', ring: 3, angle: 270, requiresPrestige: 12, parentId: 'luck-2', effect: { type: 'unlock-board-size', size: 7 }, color: 'var(--color-sky)' },
  { id: 'ring3-q3', label: '?', description: '???', ring: 3, angle: 330, requiresPrestige: 3, parentId: 'offline-plus', effect: { type: 'add-offline-pct', amount: 25 }, color: 'var(--color-coral)' },

  { id: 'board-8', label: '8×8', description: 'unlock 8×8 boards', ring: 4, angle: 90, requiresPrestige: 16, parentId: 'board-5', effect: { type: 'unlock-board-size', size: 8 }, color: 'var(--color-sky)' },
  { id: 'board-9', label: '9×9', description: 'unlock 9×9 boards', ring: 4, angle: 270, requiresPrestige: 20, parentId: 'board-7', effect: { type: 'unlock-board-size', size: 9 }, color: 'var(--color-sky)' },
]

export const findResearchNode = (id: string): ResearchNodeDef | undefined => RESEARCH_NODES.find((n) => n.id === id)
