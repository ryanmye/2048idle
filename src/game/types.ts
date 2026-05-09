export type GridSize = 4 | 5 | 6 | 7 | 8 | 9

export type Direction = 'left' | 'right' | 'up' | 'down'

export type BotType =
  | 'rand'
  | 'lu'
  | 'corner'
  | 'snake'
  | 'greedy'
  | 'minmax2'
  | 'minmax4'
  | 'expecti'
  | 'mcts'
  | 'ntuple'
  | 'afterstate'
  | 'myth'

export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC'

export type UpgradeKind = 'speed' | 'depth' | 'mergeBonus' | 'lucky'

export interface BotCatalogEntry {
  id: BotType
  name: string
  rarity: Rarity
  tier: number
  mps: number | null
  cost: number | null
  algo: string
  unlock: string
  color: string
  hidden?: boolean
}

export interface AchievementDefinition {
  id: string
  label: string
  reward: string
  cat: 'tile' | 'score' | 'life' | 'moves' | 'bot' | 'board' | 'meta' | 'rage' | 'hidden'
  hidden?: boolean
  effect?: AchievementEffect
}

export type AchievementEffect =
  | { type: 'unlock-bot'; botId: BotType }
  | { type: 'add-pts'; amount: number }
  | { type: 'add-prestige'; amount: number }
  | { type: 'add-board-slot'; amount: number }
  | { type: 'bump-autorestart-cap'; amount: number }
  | { type: 'add-offline-pct'; amount: number }
  | { type: 'extend-rage-pct'; amount: number }
  | { type: 'open-research' }
  | { type: 'add-global-bot-speed-pct'; amount: number }
  | { type: 'add-global-pts-pct'; amount: number }
  | { type: 'add-rarity-speed-pct'; rarity: Rarity; amount: number }
  | { type: 'add-starter-mps'; amount: number }

export type ResearchEffect =
  | { type: 'add-global-bot-speed-pct'; amount: number }
  | { type: 'add-global-pts-pct'; amount: number }
  | { type: 'add-board-slot'; amount: number }
  | { type: 'add-merge-bonus-pct'; amount: number }
  | { type: 'add-depth-cap'; amount: number }
  | { type: 'add-luck-pct'; amount: number }
  | { type: 'extend-rage-pct'; amount: number }
  | { type: 'unlock-fusion' }
  | { type: 'add-offline-pct'; amount: number }
  | { type: 'unlock-board-size'; size: GridSize }

export interface Tile {
  id: string
  value: number
  row: number
  col: number
  fresh?: boolean
  merged?: boolean
}

export interface Board {
  id: string
  name: string
  gridSize: GridSize
  tiles: Tile[]
  ownerBotId: string | 'manual'
  score: number
  bestTile: number
  movesSinceRestart: number
  lastMoveAt: number
}

export interface Bot {
  uid: string
  /** Monotonic instance id per save; never reused after sell. */
  serial: number
  /** Display override; null uses catalog name after serial prefix. */
  nickname: string | null
  type: BotType
  level: number
  enabled: boolean
  boardId: string | null
  upgrades: {
    speed: number
    depth: number
    mergeBonus: number
    lucky: number
  }
  lifetime: {
    moves: number
    merges: number
    restartsUsed: number
  }
  moveBudget: number
}

export interface Autorestarts {
  current: number
  max: number
  lastRegenAt: number
}

export interface AchievementState {
  got: boolean
  gotAt?: number
}

export interface LifetimeStats {
  totalPts: number
  totalMoves: number
  totalMerges: number
  bestTile: number
  prestiges: number
  rageTriggers: number
  playTime: number
  boardsFinished: number
}

export interface Farm {
  id: string
  name: string
  boardIds: string[]
}

export interface Settings {
  reducedMotion: boolean
  soundEnabled: boolean
  showFps: boolean
  themeAccent: string
}

export interface Toast {
  id: string
  kind: 'achievement' | 'info' | 'warn' | 'prestige'
  title: string
  body?: string
  createdAt: number
}

export interface OfflineSummary {
  points: number
  usedAutorestarts: number
  elapsedSec: number
}

export interface GameState {
  points: number
  prestigeTokens: number
  prestigeLevel: number
  boards: Board[]
  boardSlots: number
  bots: Bot[]
  unlockedBotTypes: BotType[]
  unlockedBoardSizes: GridSize[]
  achievements: Record<string, AchievementState>
  research: { ownedNodes: string[]; open: boolean }
  autorestarts: Autorestarts
  lifetime: LifetimeStats
  rage: {
    meter: number
    activeUntil: number
  }
  offlineRateBonusPct: number
  globalBotSpeedPct: number
  globalPtsPct: number
  rageDurationPct: number
  rarityBotSpeedPct: Partial<Record<Rarity, number>>
  starterMpsBonus: number
  manualRestartConsumed: number
  fusionUnlocked: boolean
  boardNames: Record<string, string>
  farms: Farm[]
  pointsHistory: number[]
  lastTickAt: number
  lastSavedAt: number
  lastSampleAt: number
  lastManualMoveAt: number
  lastPointsSnapshot: number
  toasts: Toast[]
  settings: Settings
  offlineSummary?: OfflineSummary
  schemaVersion: number
  /** Next bot serial to assign on buy/fuse; persists across prestige, not reset on sell. */
  nextBotSerial: number
  /** Session-only: `/board/:id` focus for keyboard/swipe (not persisted). Player can move in parallel with the bot. */
  detailRouteBoardId: string | null
}
