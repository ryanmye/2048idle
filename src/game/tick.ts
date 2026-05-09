import { BALANCE } from '../data/balance'
import { BOTS } from '../data/bots'
import { pickDirection } from './bots/strategies'
import { createEmpty, hasMoves, maxTile, move, spawnTile } from './grid'
import type { Bot, GameState } from './types'

const catalogMps = (botType: Bot['type']): number => {
  const cat = BOTS.find((b) => b.id === botType)
  return cat?.mps ?? 0
}

const catalogRarity = (botType: Bot['type']) => BOTS.find((b) => b.id === botType)?.rarity

export const botMps = (bot: Bot, state: GameState, nowMs: number): number => {
  const base = catalogMps(bot.type) + state.starterMpsBonus
  const speedLevelMult = BALANCE.upgrades.speedMultiplierPerLevel ** bot.upgrades.speed
  const globalMult = 1 + state.globalBotSpeedPct / 100
  const rarity = catalogRarity(bot.type)
  const rarityBonus = rarity ? state.rarityBotSpeedPct[rarity] ?? 0 : 0
  const rarityMult = 1 + rarityBonus / 100
  const rageMult = state.rage.activeUntil > nowMs ? BALANCE.rage.speedMultiplier : 1
  return base * speedLevelMult * globalMult * rarityMult * rageMult
}

export const advanceTick = (state: GameState, nowMs: number): GameState => {
  const looksLikeEpoch = nowMs > 1_000_000_000_000
  const normalizedNowMs = looksLikeEpoch ? nowMs : Date.now()
  const correctedNowMs =
    normalizedNowMs < state.lastTickAt ? Date.now() : normalizedNowMs
  const dt = Math.max(0, (correctedNowMs - state.lastTickAt) / 1000)
  if (dt === 0) return state

  const next: GameState = {
    ...state,
    lastTickAt: correctedNowMs,
    lifetime: { ...state.lifetime, playTime: state.lifetime.playTime + dt },
    bots: state.bots.map((b) => ({
      ...b,
      upgrades: { ...b.upgrades },
      lifetime: { ...b.lifetime },
    })),
    boards: state.boards.map((b) => ({ ...b, tiles: b.tiles.map((t) => ({ ...t })) })),
    autorestarts: { ...state.autorestarts },
    rage: { ...state.rage },
    research: { ...state.research, ownedNodes: [...state.research.ownedNodes] },
    pointsHistory: [...state.pointsHistory],
    rarityBotSpeedPct: { ...state.rarityBotSpeedPct },
  }

  if (
    next.autorestarts.current < next.autorestarts.max &&
    nowMs - next.autorestarts.lastRegenAt >= BALANCE.autorestarts.regenSeconds * 1000
  ) {
    const gained = Math.floor(
      (nowMs - next.autorestarts.lastRegenAt) / (BALANCE.autorestarts.regenSeconds * 1000),
    )
    next.autorestarts = {
      current: Math.min(next.autorestarts.max, next.autorestarts.current + gained),
      max: next.autorestarts.max,
      lastRegenAt:
        next.autorestarts.lastRegenAt + gained * BALANCE.autorestarts.regenSeconds * 1000,
    }
  }

  const ptsMult = 1 + next.globalPtsPct / 100

  for (const bot of next.bots) {
    if (!bot.boardId) continue
    if (!bot.enabled) continue
    const board = next.boards.find((b) => b.id === bot.boardId)
    if (!board) continue
    const mps = botMps(bot, next, nowMs)
    bot.moveBudget += mps * dt
    let safety = 200
    while (bot.moveBudget >= 1 && safety > 0) {
      safety -= 1
      bot.moveBudget -= 1
      const direction = pickDirection(bot.type, board.tiles, board.gridSize)
      if (!direction) break
      const out = move(board.tiles, board.gridSize, direction)
      if (!out.moved) {
        bot.moveBudget = 0
        break
      }
      const luckyChance = bot.upgrades.lucky * 0.05
      const withSpawn = spawnTile(out.tiles, board.gridSize, luckyChance)
      board.tiles = withSpawn
      board.movesSinceRestart += 1
      board.lastMoveAt = nowMs
      const boardMult = BALANCE.mergeBoardSizeMultiplierBase ** (board.gridSize - 4)
      const mergeMult = 1 + bot.upgrades.mergeBonus * BALANCE.mergeBonusPerLevelPct
      const gained = Math.floor(out.gained * boardMult * mergeMult * ptsMult)
      board.score += gained
      board.bestTile = Math.max(board.bestTile, maxTile(withSpawn))
      next.points += gained
      next.lifetime.totalPts += gained
      next.lifetime.totalMoves += 1
      next.lifetime.totalMerges += out.merged
      bot.lifetime.moves += 1
      bot.lifetime.merges += out.merged
      if (!hasMoves(withSpawn, board.gridSize)) {
        if (next.autorestarts.current > 0) {
          next.autorestarts.current -= 1
          bot.lifetime.restartsUsed += 1
          next.lifetime.boardsFinished += 1
          board.tiles = spawnTile(spawnTile(createEmpty(board.gridSize), board.gridSize), board.gridSize)
          board.score = 0
          board.movesSinceRestart = 0
        } else {
          bot.moveBudget = 0
          break
        }
      }
    }
  }

  next.lifetime.bestTile = Math.max(
    next.lifetime.bestTile,
    ...next.boards.map((b) => b.bestTile),
    0,
  )

  if (nowMs - next.lastSampleAt >= BALANCE.history.sampleIntervalMs) {
    const buckets = Math.max(
      1,
      Math.floor((nowMs - next.lastSampleAt) / BALANCE.history.sampleIntervalMs),
    )
    const ptsDelta = next.points - next.lastPointsSnapshot
    const perBucket = ptsDelta / buckets
    for (let i = 0; i < buckets; i += 1) {
      next.pointsHistory.push(Math.max(0, perBucket))
      if (next.pointsHistory.length > BALANCE.history.bufferLength) next.pointsHistory.shift()
    }
    next.lastSampleAt = nowMs
    next.lastPointsSnapshot = next.points
  }

  next.lastSavedAt = nowMs
  return next
}
