import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createDebouncedJSONStorage } from '../utils/debouncedPersistStorage'
import { ACHIEVEMENTS } from '../data/achievements'
import { BALANCE } from '../data/balance'
import { BOTS } from '../data/bots'
import { ACHIEVEMENT_DEFS, applyAchievementEffect, evaluateAchievementCompletion } from '../game/achievements'
import { createEmpty, hasMoves, maxTile, move, spawnTile } from '../game/grid'
import { calculateOffline } from '../game/offline'
import { calculatePrestigeTokens } from '../game/prestige'
import { findResearchNode } from '../game/research'
import { applyResearchEffect } from '../game/researchEffects'
import { advanceTick } from '../game/tick'
import { ensureBotsSerialFields } from '../game/botSerial'
import type { Bot, BotType, Direction, Farm, GameState, GridSize, Settings, Toast, UpgradeKind } from '../game/types'
import { uid } from '../utils/rng'

interface GameActions {
  setDetailRouteBoard: (boardId: string | null) => void
  moveBoard: (boardId: string, direction: Direction) => void
  renameBoard: (boardId: string, name: string) => void
  restartManualBoard: (boardId: string) => void
  buyBot: (type: BotType) => void
  sellBot: (botUid: string) => void
  fuseBots: (type: BotType) => boolean
  assignBot: (botUid: string, boardId: string) => void
  unassignBot: (botUid: string) => void
  buyUpgrade: (botUid: string, kind: UpgradeKind) => void
  buyAutorestartRefill: (amount: number, cost: number) => void
  buyAutorestartCap: (to: number, cost: number) => void
  buyBoardSlot: () => void
  changeBoardSize: (boardId: string, size: GridSize) => void
  unlockResearchNode: (nodeId: string) => void
  prestige: () => void
  canPrestige: () => boolean
  tick: (now: number) => void
  dismissOffline: () => void
  pushToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => void
  dismissToast: (id: string) => void
  setSettings: (patch: Partial<Settings>) => void
  hardReset: () => void
  exportSave: () => string
  importSave: (json: string) => boolean
  createFarm: (name: string) => string
  renameFarm: (id: string, name: string) => void
  deleteFarm: (id: string) => void
  setBoardFarm: (boardId: string, farmId: string | null) => void
  setBotEnabled: (botUid: string, enabled: boolean) => void
  renameBot: (botUid: string, rawName: string) => void
}

const now = () => Date.now()

const makeBoard = (id: string, name: string, gridSize: GridSize = 4) => {
  let tiles = createEmpty(gridSize)
  tiles = spawnTile(spawnTile(tiles, gridSize), gridSize)
  return {
    id,
    name,
    gridSize,
    tiles,
    ownerBotId: 'manual' as const,
    score: 0,
    bestTile: 2,
    movesSinceRestart: 0,
    lastMoveAt: now(),
  }
}

const initialState = (): GameState => {
  const t = now()
  return {
    points: 0,
    prestigeTokens: 0,
    prestigeLevel: 0,
    boards: [makeBoard('board-1', 'main board', 4)],
    boardSlots: 1,
    bots: [],
    unlockedBotTypes: [],
    unlockedBoardSizes: [4],
    achievements: Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, { got: false }])),
    research: { ownedNodes: [], open: false },
    autorestarts: {
      current: BALANCE.autorestarts.startingCap,
      max: BALANCE.autorestarts.startingCap,
      lastRegenAt: t,
    },
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
    pointsHistory: Array(BALANCE.history.bufferLength).fill(0),
    lastTickAt: t,
    lastSavedAt: t,
    lastSampleAt: t,
    lastManualMoveAt: t,
    lastPointsSnapshot: 0,
    toasts: [],
    settings: {
      reducedMotion: false,
      soundEnabled: true,
      showFps: false,
      themeAccent: 'coral',
    },
    offlineSummary: undefined,
    schemaVersion: BALANCE.schemaVersion,
    nextBotSerial: 0,
    detailRouteBoardId: null,
  }
}

const createBot = (type: BotType, serial: number): Bot => ({
  uid: uid('bot'),
  serial,
  nickname: null,
  type,
  level: 1,
  enabled: true,
  boardId: null,
  upgrades: { speed: 0, depth: 0, mergeBonus: 0, lucky: 0 },
  lifetime: { moves: 0, merges: 0, restartsUsed: 0 },
  moveBudget: 0,
})

const upgradeCost = (kind: UpgradeKind, level: number, baseCost: number): number => {
  switch (kind) {
    case 'speed':
      return Math.floor(baseCost * BALANCE.upgrades.speedCostBaseMult * BALANCE.upgrades.speedCostGrowth ** level)
    case 'depth':
      return Math.floor(baseCost * BALANCE.upgrades.depthCostBaseMult * BALANCE.upgrades.depthCostGrowth ** level)
    case 'mergeBonus':
      return Math.floor(BALANCE.upgrades.mergeBonusCostStep * (level + 1))
    case 'lucky':
      return Math.floor(BALANCE.upgrades.luckyCostStep * (level + 1))
  }
}

const upgradeMaxLevel = (kind: UpgradeKind): number => {
  switch (kind) {
    case 'speed':
      return BALANCE.upgrades.speedMaxLevel
    case 'depth':
      return BALANCE.upgrades.depthMaxLevel
    case 'mergeBonus':
      return BALANCE.upgrades.mergeBonusMaxLevel
    case 'lucky':
      return BALANCE.upgrades.luckyMaxLevel
  }
}

export const getUpgradeCost = upgradeCost
export const getUpgradeMaxLevel = upgradeMaxLevel

const processAchievements = (state: GameState): GameState => {
  let mutated = false
  const newAch = { ...state.achievements }
  const newToasts: Toast[] = []
  let working: GameState = state
  for (const def of ACHIEVEMENT_DEFS) {
    const cur = newAch[def.id]
    if (cur?.got) continue
    if (!evaluateAchievementCompletion(def, working)) continue
    newAch[def.id] = { got: true, gotAt: now() }
    if (def.effect) {
      working = { ...working, achievements: newAch }
      applyAchievementEffect(working, def.effect)
    }
    newToasts.push({
      id: uid('toast'),
      kind: 'achievement',
      title: `${def.label}`,
      body: def.reward,
      createdAt: now(),
    })
    mutated = true
  }
  if (!mutated) return state
  return {
    ...working,
    achievements: newAch,
    toasts: [...working.toasts, ...newToasts],
  }
}

type StoreShape = GameState & GameActions

export const useGameStore = create<StoreShape>()(
  persist(
    (set, get) => ({
      ...initialState(),
      setDetailRouteBoard: (boardId) => set({ detailRouteBoardId: boardId }),
      moveBoard: (boardId, direction) => {
        set((state) => {
          const board = state.boards.find((b) => b.id === boardId)
          if (!board) return state
          const nowTs = now()
          const manualAnimationLockMs = 90
          const canPlayerMove =
            board.ownerBotId === 'manual' || state.detailRouteBoardId === boardId
          if (!canPlayerMove) return state
          if (nowTs - state.lastManualMoveAt < manualAnimationLockMs) {
            return state
          }
          const out = move(board.tiles, board.gridSize, direction)
          if (!out.moved) return state
          const withSpawn = spawnTile(out.tiles, board.gridSize)
          const boardMult = BALANCE.mergeBoardSizeMultiplierBase ** (board.gridSize - 4)
          const ptsMult = 1 + state.globalPtsPct / 100
          const gained = Math.floor(out.gained * boardMult * ptsMult)
          const best = maxTile(withSpawn)
          const t = nowTs
          let next: GameState = {
            ...state,
            points: state.points + gained,
            lastManualMoveAt: t,
            lifetime: {
              ...state.lifetime,
              totalPts: state.lifetime.totalPts + gained,
              totalMoves: state.lifetime.totalMoves + 1,
              totalMerges: state.lifetime.totalMerges + out.merged,
              bestTile: Math.max(state.lifetime.bestTile, best),
            },
            rage: {
              ...state.rage,
              meter: Math.min(1, state.rage.meter + 1 / BALANCE.rage.movesToFill),
            },
            boards: state.boards.map((b) =>
              b.id === boardId
                ? {
                    ...b,
                    tiles: withSpawn,
                    score: b.score + gained,
                    movesSinceRestart: b.movesSinceRestart + 1,
                    bestTile: Math.max(b.bestTile, best),
                    lastMoveAt: t,
                  }
                : b,
            ),
          }
          if (next.rage.meter >= 1) {
            const duration = BALANCE.rage.baseDurationSeconds * (1 + next.rageDurationPct / 100)
            next = {
              ...next,
              rage: { meter: 0, activeUntil: t + duration * 1000 },
              lifetime: { ...next.lifetime, rageTriggers: next.lifetime.rageTriggers + 1 },
            }
          }
          if (!hasMoves(withSpawn, board.gridSize)) {
            if (next.autorestarts.current > 0) {
              const restarted = next.boards.map((b) =>
                b.id === boardId
                  ? {
                      ...b,
                      tiles: spawnTile(spawnTile(createEmpty(b.gridSize), b.gridSize), b.gridSize),
                      score: 0,
                      movesSinceRestart: 0,
                    }
                  : b,
              )
              next = {
                ...next,
                boards: restarted,
                autorestarts: { ...next.autorestarts, current: next.autorestarts.current - 1 },
                manualRestartConsumed: next.manualRestartConsumed + 1,
                lifetime: { ...next.lifetime, boardsFinished: next.lifetime.boardsFinished + 1 },
              }
            }
          }
          return processAchievements(next)
        })
      },
      restartManualBoard: (boardId) =>
        set((state) => {
          const board = state.boards.find((b) => b.id === boardId)
          if (!board) return state
          const canRestart =
            board.ownerBotId === 'manual' || state.detailRouteBoardId === boardId
          if (!canRestart) return state
          if (state.autorestarts.current <= 0) return state
          return {
            ...state,
            autorestarts: { ...state.autorestarts, current: state.autorestarts.current - 1 },
            manualRestartConsumed: state.manualRestartConsumed + 1,
            lifetime: { ...state.lifetime, boardsFinished: state.lifetime.boardsFinished + 1 },
            boards: state.boards.map((b) =>
              b.id === boardId
                ? {
                    ...b,
                    tiles: spawnTile(spawnTile(createEmpty(b.gridSize), b.gridSize), b.gridSize),
                    score: 0,
                    movesSinceRestart: 0,
                  }
                : b,
            ),
          }
        }),
      renameBoard: (boardId, name) =>
        set((state) => ({
          ...state,
          boardNames: { ...state.boardNames, [boardId]: name },
          boards: state.boards.map((b) => (b.id === boardId ? { ...b, name } : b)),
        })),
      buyBot: (type) =>
        set((state) => {
          const catalog = BOTS.find((b) => b.id === type)
          if (!catalog || catalog.cost === null || !state.unlockedBotTypes.includes(type)) return state
          const firstRandFree = type === 'rand' && !state.bots.some((b) => b.type === 'rand')
          const price = firstRandFree ? 0 : catalog.cost
          if (state.points < price) return state

          const serial = state.nextBotSerial
          const newBot = createBot(type, serial)
          let boards = state.boards

          if (state.boards.length < state.boardSlots) {
            const boardId = `board-${state.boards.length + 1}`
            const newBoard = {
              ...makeBoard(boardId, `board ${state.boards.length + 1}`, 4),
              ownerBotId: newBot.uid,
            }
            newBot.boardId = boardId
            boards = [...state.boards, newBoard]
          } else {
            const firstManualBoard = state.boards.find((b) => b.ownerBotId === 'manual')
            if (firstManualBoard) {
              newBot.boardId = firstManualBoard.id
              boards = state.boards.map((b) =>
                b.id === firstManualBoard.id ? { ...b, ownerBotId: newBot.uid } : b,
              )
            }
          }

          const next = {
            ...state,
            points: state.points - price,
            nextBotSerial: state.nextBotSerial + 1,
            bots: [...state.bots, newBot],
            boards,
          }
          return processAchievements(next)
        }),
      sellBot: (botUid) =>
        set((state) => {
          const bot = state.bots.find((b) => b.uid === botUid)
          if (!bot) return state
          const cat = BOTS.find((b) => b.id === bot.type)
          const refund = Math.floor((cat?.cost ?? 0) * BALANCE.sell.refundPct)
          return {
            ...state,
            points: state.points + refund,
            bots: state.bots.filter((b) => b.uid !== botUid),
            boards: state.boards.map((b) => (b.ownerBotId === botUid ? { ...b, ownerBotId: 'manual' as const } : b)),
          }
        }),
      fuseBots: (type) => {
        let success = false
        set((state) => {
          if (!state.fusionUnlocked) return state
          const sameType = state.bots.filter((b) => b.type === type && !b.boardId)
          if (sameType.length < BALANCE.fusion.unitsRequired) return state
          const idx = BOTS.findIndex((b) => b.id === type)
          const nextCatalog = BOTS[idx + 1]
          if (!nextCatalog) return state
          const consumed = sameType.slice(0, BALANCE.fusion.unitsRequired).map((b) => b.uid)
          success = true
          const fuseSerial = state.nextBotSerial
          const newBot = createBot(nextCatalog.id, fuseSerial)
          newBot.level = 2
          const unlockedNext = state.unlockedBotTypes.includes(nextCatalog.id)
            ? state.unlockedBotTypes
            : [...state.unlockedBotTypes, nextCatalog.id]
          return processAchievements({
            ...state,
            nextBotSerial: state.nextBotSerial + 1,
            unlockedBotTypes: unlockedNext,
            bots: [...state.bots.filter((b) => !consumed.includes(b.uid)), newBot],
          })
        })
        return success
      },
      assignBot: (botUid, boardId) =>
        set((state) => {
          const board = state.boards.find((b) => b.id === boardId)
          if (!board) return state
          return {
            ...state,
            boards: state.boards.map((b) =>
              b.id === boardId
                ? { ...b, ownerBotId: botUid }
                : b.ownerBotId === botUid
                  ? { ...b, ownerBotId: 'manual' as const }
                  : b,
            ),
            bots: state.bots.map((bot) =>
              bot.uid === botUid
                ? { ...bot, boardId }
                : bot.boardId === boardId
                  ? { ...bot, boardId: null }
                  : bot,
            ),
          }
        }),
      unassignBot: (botUid) =>
        set((state) => {
          const bot = state.bots.find((b) => b.uid === botUid)
          if (!bot) return state
          return {
            ...state,
            bots: state.bots.map((b) => (b.uid === botUid ? { ...b, boardId: null } : b)),
            boards: state.boards.map((b) =>
              b.ownerBotId === botUid ? { ...b, ownerBotId: 'manual' as const } : b,
            ),
          }
        }),
      buyUpgrade: (botUid, kind) =>
        set((state) => {
          const bot = state.bots.find((b) => b.uid === botUid)
          if (!bot) return state
          const cat = BOTS.find((b) => b.id === bot.type)
          if (!cat?.cost) return state
          const level = bot.upgrades[kind]
          if (level >= upgradeMaxLevel(kind)) return state
          const cost = upgradeCost(kind, level, cat.cost)
          if (state.points < cost) return state
          return {
            ...state,
            points: state.points - cost,
            bots: state.bots.map((b) =>
              b.uid === botUid
                ? { ...b, upgrades: { ...b.upgrades, [kind]: level + 1 } }
                : b,
            ),
          }
        }),
      buyAutorestartRefill: (amount, cost) =>
        set((state) => {
          if (state.points < cost) return state
          const current = Math.min(state.autorestarts.max, state.autorestarts.current + amount)
          return { ...state, points: state.points - cost, autorestarts: { ...state.autorestarts, current } }
        }),
      buyAutorestartCap: (to, cost) =>
        set((state) => {
          if (state.points < cost || to <= state.autorestarts.max) return state
          return {
            ...state,
            points: state.points - cost,
            autorestarts: { ...state.autorestarts, max: to, current: Math.min(to, state.autorestarts.current) },
          }
        }),
      buyBoardSlot: () =>
        set((state) => {
          const idx = Math.max(0, state.boardSlots - 1)
          const cost =
            BALANCE.boardSlots.costs[idx] ??
            BALANCE.boardSlots.costs[BALANCE.boardSlots.costs.length - 1] *
              2 ** (idx - BALANCE.boardSlots.costs.length + 1)
          if (state.points < cost) return state
          return processAchievements({
            ...state,
            points: state.points - cost,
            boardSlots: state.boardSlots + 1,
          })
        }),
      setBotEnabled: (botUid, enabled) =>
        set((state) => ({
          ...state,
          bots: state.bots.map((b) => (b.uid === botUid ? { ...b, enabled } : b)),
        })),
      renameBot: (botUid, rawName) =>
        set((state) => {
          const bot = state.bots.find((b) => b.uid === botUid)
          if (!bot) return state
          const cat = BOTS.find((b) => b.id === bot.type)
          const catalogName = (cat?.name ?? bot.type).trim()
          const trimmed = rawName.trim()
          const nextNickname =
            trimmed === '' || trimmed === catalogName ? null : trimmed
          if (nextNickname === bot.nickname) return state
          const cost = BALANCE.bot.renameCostPts
          if (state.points < cost) {
            return {
              ...state,
              toasts: [
                ...state.toasts,
                {
                  id: uid('toast'),
                  kind: 'warn',
                  title: 'need more points',
                  body: `Renaming costs ${cost.toLocaleString()} pts.`,
                  createdAt: now(),
                },
              ],
            }
          }
          return {
            ...state,
            points: state.points - cost,
            bots: state.bots.map((b) => (b.uid === botUid ? { ...b, nickname: nextNickname } : b)),
          }
        }),
      changeBoardSize: (boardId, size) =>
        set((state) => {
          if (!state.unlockedBoardSizes.includes(size)) return state
          return {
            ...state,
            boards: state.boards.map((b) =>
              b.id === boardId
                ? {
                    ...b,
                    gridSize: size,
                    tiles: spawnTile(spawnTile(createEmpty(size), size), size),
                    score: 0,
                    movesSinceRestart: 0,
                    bestTile: 2,
                  }
                : b,
            ),
          }
        }),
      unlockResearchNode: (nodeId) =>
        set((state) => {
          if (state.prestigeTokens < BALANCE.research.nodeCost) return state
          if (state.research.ownedNodes.includes(nodeId)) return state
          const node = findResearchNode(nodeId)
          if (!node) return state
          if (state.prestigeLevel < node.requiresPrestige) return state
          if (node.parentId && !state.research.ownedNodes.includes(node.parentId)) return state
          const next: GameState = {
            ...state,
            prestigeTokens: state.prestigeTokens - BALANCE.research.nodeCost,
            research: { ...state.research, ownedNodes: [...state.research.ownedNodes, nodeId] },
          }
          applyResearchEffect(next, nodeId)
          return next
        }),
      canPrestige: () => calculatePrestigeTokens(get().lifetime.totalPts) > 0,
      prestige: () =>
        set((state) => {
          const earned = calculatePrestigeTokens(state.lifetime.totalPts)
          if (earned <= 0) return state
          const fresh = initialState()
          let next: GameState = {
            ...fresh,
            prestigeTokens: state.prestigeTokens + earned,
            prestigeLevel: state.prestigeLevel + 1,
            nextBotSerial: state.nextBotSerial,
            unlockedBotTypes: [...state.unlockedBotTypes],
            unlockedBoardSizes: [...state.unlockedBoardSizes],
            boardNames: { ...state.boardNames },
            achievements: { ...state.achievements },
            research: { ...state.research },
            settings: { ...state.settings },
            fusionUnlocked: state.fusionUnlocked,
            globalBotSpeedPct: 0,
            globalPtsPct: 0,
            offlineRateBonusPct: 0,
            rageDurationPct: 0,
            rarityBotSpeedPct: {},
            starterMpsBonus: 0,
            lifetime: {
              ...state.lifetime,
              prestiges: state.lifetime.prestiges + 1,
            },
          }
          for (const ownedId of state.research.ownedNodes) {
            applyResearchEffect(next, ownedId)
          }
          next.toasts = [
            ...next.toasts,
            { id: uid('toast'), kind: 'prestige', title: `prestige +${earned} ◆`, createdAt: now() },
          ]
          next = processAchievements(next)
          return next
        }),
      tick: (nowMs) =>
        set((state) => {
          let next = advanceTick(state, nowMs)
          next = processAchievements(next)
          return next
        }),
      dismissOffline: () => set((state) => ({ ...state, offlineSummary: undefined })),
      pushToast: (toast) =>
        set((state) => ({
          ...state,
          toasts: [...state.toasts, { ...toast, id: uid('toast'), createdAt: now() }],
        })),
      dismissToast: (id) =>
        set((state) => ({ ...state, toasts: state.toasts.filter((t) => t.id !== id) })),
      setSettings: (patch) =>
        set((state) => ({ ...state, settings: { ...state.settings, ...patch } })),
      hardReset: () => set(() => ({ ...initialState() } as StoreShape)),
      exportSave: () => {
        const data = get()
        const cleaned = { ...data, toasts: [], offlineSummary: undefined, detailRouteBoardId: null }
        return JSON.stringify(cleaned)
      },
      importSave: (json) => {
        try {
          const parsed = JSON.parse(json)
          if (typeof parsed !== 'object' || parsed === null) return false
          const merged: StoreShape = { ...initialState(), ...parsed } as StoreShape
          merged.toasts = []
          merged.offlineSummary = undefined
          merged.detailRouteBoardId = null
          const serialNorm = ensureBotsSerialFields(merged.bots, merged.nextBotSerial)
          merged.bots = serialNorm.bots
          merged.nextBotSerial = serialNorm.nextBotSerial
          set(() => merged)
          return true
        } catch {
          return false
        }
      },
      createFarm: (name) => {
        const id = uid('farm')
        set((state) => ({ ...state, farms: [...state.farms, { id, name, boardIds: [] }] }))
        return id
      },
      renameFarm: (id, name) =>
        set((state) => ({ ...state, farms: state.farms.map((f) => (f.id === id ? { ...f, name } : f)) })),
      deleteFarm: (id) =>
        set((state) => ({ ...state, farms: state.farms.filter((f) => f.id !== id) })),
      setBoardFarm: (boardId, farmId) =>
        set((state) => ({
          ...state,
          farms: state.farms.map((f) => {
            const next: Farm = { ...f, boardIds: f.boardIds.filter((b) => b !== boardId) }
            if (f.id === farmId) next.boardIds.push(boardId)
            return next
          }),
        })),
    }),
    {
      name: 'idle2048:v2',
      storage:
        createDebouncedJSONStorage(() => localStorage) ?? createJSONStorage(() => localStorage),
      version: BALANCE.schemaVersion,
      migrate: (persisted, version) => {
        const base = initialState()
        if (!persisted || typeof persisted !== 'object') return base as StoreShape
        const merged = { ...base, ...(persisted as Partial<GameState>) }
        if (version < 2) {
          merged.unlockedBoardSizes = [4]
          merged.farms = []
          merged.pointsHistory = Array(BALANCE.history.bufferLength).fill(0)
          merged.fusionUnlocked = false
          merged.globalPtsPct = 0
          merged.rarityBotSpeedPct = {}
          merged.starterMpsBonus = 0
          merged.manualRestartConsumed = 0
          merged.toasts = []
          merged.lifetime = { ...base.lifetime, ...merged.lifetime, boardsFinished: merged.lifetime?.boardsFinished ?? 0 }
        }
        merged.schemaVersion = BALANCE.schemaVersion
        merged.detailRouteBoardId = null
        if (Array.isArray(merged.bots)) {
          const sn = ensureBotsSerialFields(merged.bots as Bot[], merged.nextBotSerial as number | undefined)
          merged.bots = sn.bots.map((b: Bot) => ({
            ...b,
            enabled: typeof b.enabled === 'boolean' ? b.enabled : true,
          }))
          merged.nextBotSerial = sn.nextBotSerial
        } else {
          merged.nextBotSerial = merged.nextBotSerial ?? 0
        }
        return merged as StoreShape
      },
      partialize: (state) => {
        const { detailRouteBoardId, ...rest } = state
        void detailRouteBoardId
        return rest
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.detailRouteBoardId = null
        const t = now()
        const elapsed = t - state.lastSavedAt
        const onlinePps = state.bots.reduce((sum, bot) => {
          const catalog = BOTS.find((b) => b.id === bot.type)
          return sum + (catalog?.mps ?? 0)
        }, 0)
        const off = calculateOffline(
          onlinePps,
          elapsed,
          state.autorestarts.current,
          state.boards.length,
          state.offlineRateBonusPct,
        )
        state.points += off.points
        state.autorestarts.current = Math.max(0, state.autorestarts.current - off.usedAutorestarts)
        state.lastTickAt = t
        state.lastSavedAt = t
        state.lastSampleAt = t
        state.lastPointsSnapshot = state.points
        state.offlineSummary = off
        state.toasts = []
      },
    },
  ),
)

export const upgradeCostFor = (kind: UpgradeKind, level: number, baseCost: number) =>
  upgradeCost(kind, level, baseCost)
export const upgradeMaxLevelFor = (kind: UpgradeKind) => upgradeMaxLevel(kind)
