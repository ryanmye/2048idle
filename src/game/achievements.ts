import { ACHIEVEMENTS } from '../data/achievements'
import { BOTS } from '../data/bots'
import type {
  AchievementDefinition,
  AchievementEffect,
  GameState,
  Rarity,
} from './types'

export const evaluateAchievementCompletion = (
  def: AchievementDefinition,
  state: GameState,
): boolean => {
  const lifetime = state.lifetime
  const tilesMax = lifetime.bestTile
  const totalPts = lifetime.totalPts
  const totalMoves = lifetime.totalMoves
  const boardsRunning = state.boards.length
  const totalBots = state.bots.length

  switch (def.id) {
    case 'tile-32':
      return tilesMax >= 32
    case 'tile-64':
      return tilesMax >= 64
    case 'tile-128':
      return tilesMax >= 128
    case 'tile-256':
      return tilesMax >= 256
    case 'tile-512':
      return tilesMax >= 512
    case 'tile-1024':
      return tilesMax >= 1024
    case 'tile-2048':
      return tilesMax >= 2048
    case 'tile-4096':
      return tilesMax >= 4096
    case 'tile-8192':
      return tilesMax >= 8192
    case 'tile-16k':
      return tilesMax >= 16384
    case 'score-1k':
      return state.boards.some((b) => b.score >= 1_000)
    case 'score-10k':
      return state.boards.some((b) => b.score >= 10_000)
    case 'score-50k':
      return state.boards.some((b) => b.score >= 50_000)
    case 'score-250k':
      return state.boards.some((b) => b.score >= 250_000)
    case 'score-1m':
      return state.boards.some((b) => b.score >= 1_000_000)
    case 'life-1m':
      return totalPts >= 1_000_000
    case 'life-100m':
      return totalPts >= 100_000_000
    case 'life-1b':
      return totalPts >= 1_000_000_000
    case 'life-1t':
      return totalPts >= 1_000_000_000_000
    case 'moves-1k':
      return totalMoves >= 1_000
    case 'moves-100k':
      return totalMoves >= 100_000
    case 'moves-1m':
      return totalMoves >= 1_000_000
    case 'moves-10m':
      return totalMoves >= 10_000_000
    case 'first-bot':
      return totalBots >= 1
    case '5-bots':
      return totalBots >= 5
    case 'fuse-1':
      return state.lifetime.totalMerges > 0 && state.bots.some((b) => b.level >= 2)
    case 'all-common':
      return everyOfRarityOwned(state, 'COMMON')
    case 'all-rare':
      return everyOfRarityOwned(state, 'RARE')
    case 'boards-3':
      return boardsRunning >= 3
    case 'boards-8':
      return boardsRunning >= 8
    case 'boards-5x5':
      return state.boards.some((b) => b.gridSize === 5)
    case 'boards-7x7':
      return state.boards.some((b) => b.gridSize === 7)
    case 'prestige-1':
      return state.lifetime.prestiges >= 1
    case 'prestige-3':
      return state.lifetime.prestiges >= 3
    case 'prestige-7':
      return state.lifetime.prestiges >= 7
    case 'no-manual': {
      const ms = Date.now() - state.lastManualMoveAt
      const required = state.lifetime.playTime > 0
      return required && ms >= 24 * 60 * 60 * 1000
    }
    case 'rage-1':
      return state.lifetime.rageTriggers >= 1
    case 'rage-100':
      return state.lifetime.rageTriggers >= 100
    default:
      return false
  }
}

const everyOfRarityOwned = (state: GameState, rarity: Rarity): boolean => {
  const ofRarity = BOTS.filter((b) => b.rarity === rarity && !b.hidden)
  if (!ofRarity.length) return false
  return ofRarity.every((catalog) => state.bots.some((bot) => bot.type === catalog.id))
}

export const applyAchievementEffect = (state: GameState, effect: AchievementEffect): void => {
  switch (effect.type) {
    case 'unlock-bot':
      if (!state.unlockedBotTypes.includes(effect.botId)) state.unlockedBotTypes.push(effect.botId)
      return
    case 'add-pts':
      state.points += effect.amount
      state.lifetime.totalPts += effect.amount
      return
    case 'add-prestige':
      state.prestigeTokens += effect.amount
      return
    case 'add-board-slot':
      state.boardSlots += effect.amount
      return
    case 'bump-autorestart-cap':
      state.autorestarts.max += effect.amount
      return
    case 'add-offline-pct':
      state.offlineRateBonusPct += effect.amount
      return
    case 'extend-rage-pct':
      state.rageDurationPct += effect.amount
      return
    case 'open-research':
      state.research.open = true
      return
    case 'add-global-bot-speed-pct':
      state.globalBotSpeedPct += effect.amount
      return
    case 'add-global-pts-pct':
      state.globalPtsPct += effect.amount
      return
    case 'add-rarity-speed-pct':
      state.rarityBotSpeedPct[effect.rarity] = (state.rarityBotSpeedPct[effect.rarity] ?? 0) + effect.amount
      return
    case 'add-starter-mps':
      state.starterMpsBonus += effect.amount
      return
  }
}

export const categoryColor = (cat: AchievementDefinition['cat']): string => {
  switch (cat) {
    case 'tile':
      return 'var(--color-mint)'
    case 'score':
      return 'var(--color-butter)'
    case 'life':
      return 'var(--color-peach)'
    case 'moves':
      return 'var(--color-pink)'
    case 'bot':
      return 'var(--color-sky)'
    case 'board':
      return 'var(--color-lilac)'
    case 'meta':
      return 'var(--color-coral)'
    case 'rage':
      return 'var(--color-coral)'
    case 'hidden':
      return 'var(--color-paper2)'
  }
}

export const ACHIEVEMENT_DEFS = ACHIEVEMENTS
