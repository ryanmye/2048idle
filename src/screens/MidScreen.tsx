import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Board } from '../components/Board'
import { botTitleLine } from '../game/botLabel'
import { EditableName } from '../components/EditableName'
import { Money } from '../components/Money'
import { Sparkline } from '../components/Sparkline'
import { ACHIEVEMENTS } from '../data/achievements'
import { BALANCE } from '../data/balance'
import { BOTS } from '../data/bots'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useGameStore } from '../store/useGameStore'
import { shopAchievementProgress } from './ShopScreen'

type QuickShopTab = 'bots' | 'boards' | 'restarts' | 'boosts'

const TABS: { id: QuickShopTab; label: string }[] = [
  { id: 'bots', label: 'bots' },
  { id: 'boards', label: 'boards' },
  { id: 'restarts', label: 'restarts' },
  { id: 'boosts', label: 'boosts' },
]

export function MidScreen() {
  const [shopTab, setShopTab] = useState<QuickShopTab>('bots')
  const boards = useGameStore((s) => s.boards)
  const boardSlots = useGameStore((s) => s.boardSlots)
  const bots = useGameStore((s) => s.bots)
  const renameBoard = useGameStore((s) => s.renameBoard)
  const achievements = useGameStore((s) => s.achievements)
  const pointsHistory = useGameStore((s) => s.pointsHistory)
  const points = useGameStore((s) => s.points)
  const unlockedBotTypes = useGameStore((s) => s.unlockedBotTypes)
  const buyBot = useGameStore((s) => s.buyBot)
  const buyBoardSlot = useGameStore((s) => s.buyBoardSlot)
  const buyRefill = useGameStore((s) => s.buyAutorestartRefill)
  const buyCap = useGameStore((s) => s.buyAutorestartCap)
  const autorestarts = useGameStore((s) => s.autorestarts)
  const canPrestige = useGameStore((s) => s.canPrestige())
  const prestige = useGameStore((s) => s.prestige)
  const researchOpen = useGameStore((s) => s.research.open)
  const reducedMotion = useReducedMotion()
  const navigate = useNavigate()

  const ownedByType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const b of bots) counts[b.type] = (counts[b.type] ?? 0) + 1
    return counts
  }, [bots])

  const slotIdx = Math.max(0, boardSlots - 1)
  const nextSlotCost = BALANCE.boardSlots.costs[slotIdx] ?? BALANCE.boardSlots.costs.at(-1)!
  const slotMaxedOut = boardSlots >= 8

  const nextHint = useMemo(() => {
    const state = useGameStore.getState()
    let bestId: string | null = null
    let bestProgress = -1
    for (const a of ACHIEVEMENTS) {
      if (a.hidden) continue
      if (achievements[a.id]?.got) continue
      const fn = shopAchievementProgress[a.id]
      if (!fn) continue
      const p = Math.min(1, fn(state))
      if (p > bestProgress) {
        bestProgress = p
        bestId = a.id
      }
    }
    return bestId ? { def: ACHIEVEMENTS.find((a) => a.id === bestId)!, progress: bestProgress } : null
  }, [achievements])

  const quickBots = useMemo(
    () => BOTS.filter((b) => !b.hidden && unlockedBotTypes.includes(b.id)),
    [unlockedBotTypes],
  )

  const justUnlocked = useMemo(() => {
    const got = ACHIEVEMENTS.filter((a) => achievements[a.id]?.got)
    if (!got.length) return null
    return got
      .map((a) => ({ ach: a, ts: achievements[a.id].gotAt ?? 0 }))
      .sort((a, b) => b.ts - a.ts)[0]?.ach ?? null
  }, [achievements])

  const findOwner = (boardId: string) => bots.find((b) => b.boardId === boardId)
  const ownerLabel = (boardId: string) => {
    const bot = findOwner(boardId)
    if (!bot) return 'manual'
    const cat = BOTS.find((c) => c.id === bot.type)
    return botTitleLine(bot, cat)
  }
  const ownerMps = (boardId: string) => {
    const bot = findOwner(boardId)
    if (!bot) return 0
    return BOTS.find((c) => c.id === bot.type)?.mps ?? 0
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">
            boards · {boards.length} / {boardSlots} capacity
          </h2>
          <Money />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {boards.slice(0, 6).map((board) => (
            <button
              key={board.id}
              onClick={() => navigate(`/board/${board.id}`)}
              className="group rounded-xl border border-[var(--color-ink)] bg-white p-2 text-left transition-shadow hover:shadow-[0_3px_0_var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:outline-none"
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-sm font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  <EditableName value={board.name} onSave={(name) => renameBoard(board.id, name)} />
                </p>
                <span className="text-[10px] uppercase text-[var(--color-ink-soft)]">{board.gridSize}×{board.gridSize}</span>
              </div>
              <Board tiles={board.tiles} gridSize={board.gridSize} compact reducedMotion={reducedMotion} />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="rounded-full border border-[var(--color-ink)] bg-[var(--color-paper2)] px-2 py-0.5">
                  {ownerLabel(board.id)}
                </span>
                <span className="font-mono">{ownerMps(board.id).toFixed(1)} m/s · {board.score.toLocaleString()} pts</span>
              </div>
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Production · last {pointsHistory.length}s</p>
          <Sparkline points={pointsHistory.length ? pointsHistory : [0, 0, 0]} />
        </div>
      </section>
      <aside className="flex min-h-0 flex-col gap-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <h3 className="font-serif text-xl">just unlocked</h3>
        {justUnlocked ? (
          <div className="shrink-0 rounded-xl border border-[var(--color-ink)] bg-[var(--color-mint)] p-3">
            <p className="text-[10px] uppercase tracking-wide">{justUnlocked.cat}</p>
            <p className="font-serif text-base">{justUnlocked.label}</p>
            <p className="text-xs">→ {justUnlocked.reward}</p>
          </div>
        ) : (
          <p className="shrink-0 text-sm text-[var(--color-ink-soft)]">complete an achievement to see it here</p>
        )}
        <h3 className="shrink-0 font-serif text-xl">quick shop</h3>
        <div className="flex shrink-0 flex-wrap gap-2 text-xs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setShopTab(t.id)}
              className={`rounded-full border border-[var(--color-ink)] px-3 py-1 transition ${
                shopTab === t.id ? 'bg-[var(--color-mint)]' : 'bg-white hover:bg-[var(--color-paper2)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-[10rem] max-h-[min(22rem,45vh)] flex-1 overflow-y-auto overscroll-y-contain rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-3 text-sm">
          {shopTab === 'bots' && (
            <div className="space-y-2">
              {quickBots.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-soft)]">unlock bots via milestones in the full shop.</p>
              ) : (
                quickBots.map((bot) => {
                  const owned = ownedByType[bot.id] ?? 0
                  const firstRandFree = bot.id === 'rand' && owned === 0
                  const price = bot.cost !== null ? (firstRandFree ? 0 : bot.cost) : null
                  const canBuy = price !== null && points >= price
                  return (
                    <div
                      key={bot.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-ink)]/25 bg-white px-2 py-1.5"
                    >
                      <span className="min-w-0 truncate font-medium">{bot.name}</span>
                      <span className="shrink-0 font-mono text-xs">
                        {firstRandFree && bot.cost ? (
                          <>
                            <span className="text-[var(--color-ink-soft)] line-through">{bot.cost}</span> 0
                          </>
                        ) : (
                          bot.cost?.toLocaleString() ?? '?'
                        )}
                      </span>
                      <button
                        type="button"
                        disabled={!canBuy}
                        onClick={() => bot.cost !== null && buyBot(bot.id)}
                        className="shrink-0 rounded border border-[var(--color-ink)] bg-[var(--color-mint)] px-2 py-0.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        buy
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}
          {shopTab === 'boards' && (
            <div className="space-y-2">
              <p className="text-xs text-[var(--color-ink-soft)]">
                Boards in use: {boards.length} / {boardSlots}. New boards appear when you buy a bot and have spare capacity.
              </p>
              <p className="font-mono text-sm">Next: {nextSlotCost.toLocaleString()} pts</p>
              <button
                type="button"
                onClick={() => buyBoardSlot()}
                disabled={slotMaxedOut || points < nextSlotCost}
                className="w-full rounded-lg border border-[var(--color-ink)] bg-[var(--color-mint)] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {slotMaxedOut ? 'capacity maxed' : 'buy capacity'}
              </button>
            </div>
          )}
          {shopTab === 'restarts' && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide">autorestarts {autorestarts.current}/{autorestarts.max}</p>
              <div className="flex flex-wrap gap-2">
                {BALANCE.autorestarts.refill.map((r) => {
                  const full = autorestarts.current >= autorestarts.max
                  const can = points >= r.cost && !full
                  return (
                    <button
                      key={r.amount}
                      type="button"
                      onClick={() => buyRefill(r.amount, r.cost)}
                      disabled={!can}
                      className="rounded border border-[var(--color-ink)] bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      +{r.amount} ({r.cost})
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {BALANCE.autorestarts.permanentCaps.map((c) => {
                  const can = points >= c.cost && c.to > autorestarts.max
                  return (
                    <button
                      key={c.to}
                      type="button"
                      onClick={() => buyCap(c.to, c.cost)}
                      disabled={!can}
                      className="rounded border border-[var(--color-ink)] bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      cap→{c.to} ({c.cost})
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {shopTab === 'boosts' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--color-ink)]/30 bg-[var(--color-butter)]/40 p-2">
                <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-soft)]">next milestone</p>
                {nextHint ? (
                  <>
                    <p className="text-sm">
                      {nextHint.def.label} → {nextHint.def.reward}
                    </p>
                    <div className="mt-2 h-2 overflow-hidden rounded bg-white">
                      <div
                        className="h-full bg-[var(--color-coral)]"
                        style={{ width: `${Math.round(nextHint.progress * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs">{Math.round(nextHint.progress * 100)}%</p>
                  </>
                ) : (
                  <p className="text-xs text-[var(--color-ink-soft)]">all hints cleared — stack lifetime pts</p>
                )}
              </div>
              {canPrestige && (
                <button
                  type="button"
                  onClick={() => prestige()}
                  className="w-full rounded-lg border border-[var(--color-ink)] bg-[var(--color-lilac)] px-3 py-2 text-sm"
                >
                  prestige (when ready)
                </button>
              )}
              {researchOpen && (
                <button
                  type="button"
                  onClick={() => navigate('/research')}
                  className="w-full rounded-lg border border-[var(--color-ink)] bg-white px-3 py-2 text-sm"
                >
                  open research →
                </button>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="shrink-0 rounded-lg border border-[var(--color-ink)] bg-[var(--color-butter)] px-3 py-1 text-sm"
        >
          open full shop →
        </button>
      </aside>
    </div>
  )
}
