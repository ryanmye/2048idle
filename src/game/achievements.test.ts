import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS } from '../data/achievements'
import { applyAchievementEffect, evaluateAchievementCompletion } from './achievements'
import type { GameState } from './types'

const baseState = (): GameState => ({
  points: 0,
  prestigeTokens: 0,
  prestigeLevel: 0,
  boards: [],
  boardSlots: 1,
  bots: [],
  unlockedBotTypes: [],
  unlockedBoardSizes: [4],
  achievements: {},
  research: { ownedNodes: [], open: false },
  autorestarts: { current: 100, max: 100, lastRegenAt: 0 },
  lifetime: {
    totalPts: 0,
    totalMoves: 0,
    totalMerges: 0,
    bestTile: 2,
    prestiges: 0,
    rageTriggers: 0,
    playTime: 0,
    boardsFinished: 0,
  },
  rage: { meter: 0, activeUntil: 0 },
  offlineRateBonusPct: 0,
  globalBotSpeedPct: 0,
  globalPtsPct: 0,
  rageDurationPct: 0,
  rarityBotSpeedPct: {},
  starterMpsBonus: 0,
  manualRestartConsumed: 0,
  fusionUnlocked: false,
  boardNames: {},
  farms: [],
  pointsHistory: [],
  lastTickAt: 0,
  lastSavedAt: 0,
  lastSampleAt: 0,
  lastManualMoveAt: 0,
  lastPointsSnapshot: 0,
  toasts: [],
  settings: { reducedMotion: false, soundEnabled: true, showFps: false, themeAccent: 'coral' },
  schemaVersion: 3,
  nextBotSerial: 0,
  detailRouteBoardId: null,
})

describe('achievements', () => {
  it('detects 64 tile completion', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'tile-64')!
    const s = baseState()
    s.lifetime.bestTile = 64
    expect(evaluateAchievementCompletion(def, s)).toBe(true)
  })

  it('does not complete tile-64 below threshold', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'tile-64')!
    const s = baseState()
    s.lifetime.bestTile = 32
    expect(evaluateAchievementCompletion(def, s)).toBe(false)
  })

  it('applies unlock-bot effect', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'tile-64')!
    const s = baseState()
    applyAchievementEffect(s, def.effect!)
    expect(s.unlockedBotTypes).toContain('rand')
  })

  it('applies add-pts effect', () => {
    const s = baseState()
    applyAchievementEffect(s, { type: 'add-pts', amount: 100 })
    expect(s.points).toBe(100)
    expect(s.lifetime.totalPts).toBe(100)
  })

  it('applies add-rarity-speed-pct effect', () => {
    const s = baseState()
    applyAchievementEffect(s, { type: 'add-rarity-speed-pct', rarity: 'COMMON', amount: 10 })
    expect(s.rarityBotSpeedPct.COMMON).toBe(10)
  })
})
