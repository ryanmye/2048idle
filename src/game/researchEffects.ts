import { findResearchNode } from './research'
import type { GameState, GridSize, ResearchEffect } from './types'

export const applyResearchEffect = (state: GameState, nodeId: string): void => {
  const node = findResearchNode(nodeId)
  if (!node) return
  apply(state, node.effect)
}

const apply = (state: GameState, effect: ResearchEffect): void => {
  switch (effect.type) {
    case 'add-global-bot-speed-pct':
      state.globalBotSpeedPct += effect.amount
      return
    case 'add-global-pts-pct':
      state.globalPtsPct += effect.amount
      return
    case 'add-board-slot':
      state.boardSlots += effect.amount
      return
    case 'add-merge-bonus-pct':
      for (const bot of state.bots) bot.upgrades.mergeBonus += Math.floor(effect.amount / 5)
      return
    case 'add-depth-cap':
      return
    case 'add-luck-pct':
      return
    case 'extend-rage-pct':
      state.rageDurationPct += effect.amount
      return
    case 'unlock-fusion':
      state.fusionUnlocked = true
      return
    case 'add-offline-pct':
      state.offlineRateBonusPct += effect.amount
      return
    case 'unlock-board-size':
      addUnlockedBoardSize(state, effect.size)
      return
  }
}

const addUnlockedBoardSize = (state: GameState, size: GridSize) => {
  if (!state.unlockedBoardSizes.includes(size)) state.unlockedBoardSizes.push(size)
}
