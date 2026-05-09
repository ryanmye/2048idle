import { useMemo } from 'react'
import { Money } from '../components/Money'
import { ACHIEVEMENTS } from '../data/achievements'
import { BALANCE } from '../data/balance'
import { BOTS } from '../data/bots'
import { useGameStore } from '../store/useGameStore'

/** Next-unlock progress weights; shared with Mid quick shop. */
export const shopAchievementProgress: Record<string, (s: ReturnType<typeof useGameStore.getState>) => number> = {
  'tile-32': (s) => s.lifetime.bestTile / 32,
  'tile-64': (s) => s.lifetime.bestTile / 64,
  'tile-128': (s) => s.lifetime.bestTile / 128,
  'tile-256': (s) => s.lifetime.bestTile / 256,
  'tile-512': (s) => s.lifetime.bestTile / 512,
  'tile-1024': (s) => s.lifetime.bestTile / 1024,
  'tile-2048': (s) => s.lifetime.bestTile / 2048,
  'score-1k': (s) => Math.max(...s.boards.map((b) => b.score), 0) / 1000,
  'score-10k': (s) => Math.max(...s.boards.map((b) => b.score), 0) / 10000,
  'score-50k': (s) => Math.max(...s.boards.map((b) => b.score), 0) / 50000,
  'life-1m': (s) => s.lifetime.totalPts / 1_000_000,
  'moves-1k': (s) => s.lifetime.totalMoves / 1000,
  'moves-100k': (s) => s.lifetime.totalMoves / 100_000,
  'first-bot': (s) => s.bots.length / 1,
  '5-bots': (s) => s.bots.length / 5,
  'boards-3': (s) => s.boards.length / 3,
  'boards-8': (s) => s.boards.length / 8,
}

export function ShopScreen() {
  const points = useGameStore((s) => s.points)
  const unlocked = useGameStore((s) => s.unlockedBotTypes)
  const bots = useGameStore((s) => s.bots)
  const buyBot = useGameStore((s) => s.buyBot)
  const auto = useGameStore((s) => s.autorestarts)
  const buyRefill = useGameStore((s) => s.buyAutorestartRefill)
  const buyCap = useGameStore((s) => s.buyAutorestartCap)
  const buyBoardSlot = useGameStore((s) => s.buyBoardSlot)
  const ownedByType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const b of bots) counts[b.type] = (counts[b.type] ?? 0) + 1
    return counts
  }, [bots])
  const boardSlots = useGameStore((s) => s.boardSlots)
  const boardsCount = useGameStore((s) => s.boards.length)
  const achievements = useGameStore((s) => s.achievements)
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[var(--color-ink)] bg-[var(--color-mint)] px-3 py-1">bots ({BOTS.length})</span>
          <span className="rounded-full border border-[var(--color-ink)] px-3 py-1" title="boards in use / max">
            boards {boardsCount}/{boardSlots}
          </span>
          <span className="rounded-full border border-[var(--color-ink)] px-3 py-1">restarts</span>
          <span className="rounded-full border border-[var(--color-ink)] px-3 py-1">boosts</span>
        </div>
        <Money />
      </div>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Unlock bots via milestones. Buying a bot creates a new board if you have spare capacity; otherwise it assigns to an open manual board or sits unassigned.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {BOTS.map((bot) => {
          const isUnlocked = unlocked.includes(bot.id)
          const owned = ownedByType[bot.id] ?? 0
          const firstRandFree = bot.id === 'rand' && owned === 0
          const price = bot.cost !== null ? (firstRandFree ? 0 : bot.cost) : null
          const canBuy = isUnlocked && price !== null && points >= price
          return (
            <div
              key={bot.id}
              className="rounded-xl border border-[var(--color-ink)] p-3"
              style={{ background: bot.color, opacity: isUnlocked ? 1 : 0.6 }}
            >
              <div className="flex items-center justify-between text-xs">
                <span>{bot.rarity} · T{bot.tier}</span>
                <span title="owned">×{owned}</span>
              </div>
              <h3 className="mt-1 font-serif text-lg">{bot.hidden ? '???' : bot.name}</h3>
              <p className="min-h-10 text-sm text-[var(--color-ink-soft)]">{bot.hidden ? '—' : bot.algo}</p>
              <p className="text-xs">{bot.unlock}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-sm font-mono">
                  {firstRandFree && bot.cost ? (
                    <>
                      <span className="text-[var(--color-ink-soft)] line-through">{bot.cost.toLocaleString()}</span>{' '}
                      <span className="font-semibold text-[var(--color-ink)]">0</span>
                    </>
                  ) : (
                    bot.cost?.toLocaleString() ?? '?'
                  )}{' '}
                  pts
                  {firstRandFree && <span className="ml-1 text-xs font-sans text-[var(--color-ink-soft)]">first free</span>}
                </span>
                <button
                  disabled={!canBuy}
                  onClick={() => bot.cost !== null && buyBot(bot.id)}
                  className="rounded border border-[var(--color-ink)] bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUnlocked ? (canBuy ? 'buy' : 'too pricey') : 'locked'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-pink)] p-3">
          <p className="text-xs uppercase tracking-wide">autorestarts {auto.current}/{auto.max}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BALANCE.autorestarts.refill.map((r) => {
              const full = auto.current >= auto.max
              const can = points >= r.cost && !full
              return (
                <button
                  key={r.amount}
                  onClick={() => buyRefill(r.amount, r.cost)}
                  disabled={!can}
                  className="rounded border border-[var(--color-ink)] bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +{r.amount} ({r.cost})
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {BALANCE.autorestarts.permanentCaps.map((c) => {
              const can = points >= c.cost && c.to > auto.max
              return (
                <button
                  key={c.to}
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
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-mint)] p-3">
          <p className="text-xs uppercase tracking-wide">board capacity</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Raise how many boards can exist at once ({boardsCount}/{boardSlots} now). New boards appear when you buy a bot and have room.
          </p>
          <p className="mt-2 text-sm">Next increase: {nextSlotCost.toLocaleString()} pts</p>
          <button
            onClick={buyBoardSlot}
            disabled={slotMaxedOut || points < nextSlotCost}
            className="mt-2 rounded border border-[var(--color-ink)] bg-white px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {slotMaxedOut ? 'capacity maxed' : 'buy capacity'}
          </button>
        </div>
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-butter)] p-3">
          <p className="text-xs uppercase tracking-wide">next unlock hint</p>
          {nextHint ? (
            <>
              <p className="text-sm">{nextHint.def.label} → {nextHint.def.reward}</p>
              <div className="mt-2 h-2 overflow-hidden rounded bg-white">
                <div
                  className="h-full bg-[var(--color-coral)]"
                  style={{ width: `${Math.round(nextHint.progress * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs">{Math.round(nextHint.progress * 100)}%</p>
            </>
          ) : (
            <p className="text-sm">all hints cleared — keep stacking lifetime pts</p>
          )}
        </div>
      </div>
    </div>
  )
}
