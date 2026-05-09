import type { BotCatalogEntry } from '../game/types'

export const BOTS: BotCatalogEntry[] = [
  { id: 'rand', name: 'Random Walker', rarity: 'COMMON', tier: 1, mps: 0.5, cost: 125, algo: 'uniform random direction', unlock: 'reach a 64 tile', color: 'var(--color-peach)' },
  { id: 'lu', name: 'Left-Up', rarity: 'COMMON', tier: 1, mps: 1, cost: 1100, algo: 'left, then up. always.', unlock: 'reach a 128 tile', color: 'var(--color-peach)' },
  { id: 'corner', name: 'Corner', rarity: 'COMMON', tier: 1, mps: 1, cost: 1500, algo: 'anchors largest tile in corner', unlock: 'reach a 256 tile', color: 'var(--color-peach)' },
  { id: 'snake', name: 'Snake', rarity: 'UNCOMMON', tier: 2, mps: 1.4, cost: 4300, algo: 'snake-fills row by row', unlock: 'reach a 512 tile', color: 'var(--color-sky)' },
  { id: 'greedy', name: 'Greedy', rarity: 'UNCOMMON', tier: 2, mps: 1.6, cost: 6500, algo: 'max-merge each move', unlock: 'score 50,000 on one board', color: 'var(--color-sky)' },
  { id: 'minmax2', name: 'Minimax · d2', rarity: 'RARE', tier: 3, mps: 2, cost: 10500, algo: 'looks 2 moves ahead', unlock: 'reach a 1024 tile', color: 'var(--color-mint)' },
  { id: 'minmax4', name: 'Minimax · d4', rarity: 'RARE', tier: 3, mps: 2.4, cost: 30000, algo: 'looks 4 moves ahead', unlock: 'reach a 2048 tile', color: 'var(--color-mint)' },
  { id: 'expecti', name: 'Expectimax', rarity: 'EPIC', tier: 4, mps: 2.6, cost: 102000, algo: 'weighted by spawn odds', unlock: 'reach a 4096 tile', color: 'var(--color-lilac)' },
  { id: 'mcts', name: 'Monte Carlo', rarity: 'EPIC', tier: 4, mps: 2.2, cost: 175000, algo: 'simulates 200 rollouts/move', unlock: '10,000,000 total moves', color: 'var(--color-lilac)' },
  { id: 'ntuple', name: 'n-Tuple Network', rarity: 'LEGENDARY', tier: 5, mps: 3, cost: 1500000, algo: 'trained pattern weights', unlock: 'reach an 8192 tile', color: 'var(--color-coral)' },
  { id: 'afterstate', name: 'Afterstate-TD', rarity: 'LEGENDARY', tier: 5, mps: 3.4, cost: 10500000, algo: 'TD-learned value function', unlock: 'lifetime 1T points', color: 'var(--color-coral)' },
  { id: 'myth', name: '???', rarity: 'MYTHIC', tier: 6, mps: null, cost: null, algo: '?', unlock: 'reach a 16,384 tile · prestige 7+', color: 'var(--color-ink)', hidden: true },
]

export const START_UNLOCKED_BOT_TYPES: BotCatalogEntry['id'][] = []
