import { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssignBotDropdown } from '../components/AssignBotDropdown'
import { Board } from '../components/Board'
import { EditableName } from '../components/EditableName'
import { Money } from '../components/Money'
import { BOTS } from '../data/bots'
import { BOT_UPGRADE_DEFS } from '../data/botUpgrades'
import { botTitleLine } from '../game/botLabel'
import { hasMoves } from '../game/grid'
import { useKeyboardInput } from '../hooks/useKeyboardInput'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useGameStore, upgradeCostFor, upgradeMaxLevelFor } from '../store/useGameStore'
import type { Direction, GridSize } from '../game/types'

export function BoardDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const board = useGameStore((s) => s.boards.find((b) => b.id === id))
  const bots = useGameStore((s) => s.bots)
  const setDetailRouteBoard = useGameStore((s) => s.setDetailRouteBoard)
  const renameBoard = useGameStore((s) => s.renameBoard)
  const moveBoard = useGameStore((s) => s.moveBoard)
  const restartManual = useGameStore((s) => s.restartManualBoard)
  const autorestarts = useGameStore((s) => s.autorestarts)
  const unlockedSizes = useGameStore((s) => s.unlockedBoardSizes)
  const changeSize = useGameStore((s) => s.changeBoardSize)
  const lifetimeTotalPts = useGameStore((s) => s.lifetime.totalPts)
  const setBotEnabled = useGameStore((s) => s.setBotEnabled)
  const points = useGameStore((s) => s.points)
  const buyUpgrade = useGameStore((s) => s.buyUpgrade)
  const reducedMotion = useReducedMotion()
  const navigate = useNavigate()

  useEffect(() => {
    if (board) {
      setDetailRouteBoard(board.id)
      return () => setDetailRouteBoard(null)
    }
    setDetailRouteBoard(null)
  }, [board, setDetailRouteBoard])

  const move = useCallback(
    (dir: Direction) => {
      if (!board) return
      moveBoard(board.id, dir)
    },
    [board, moveBoard],
  )

  const isManual = board?.ownerBotId === 'manual'
  const canPlayerMove = !!board

  useKeyboardInput(canPlayerMove ? move : undefined, !!board && canPlayerMove)

  if (!board) {
    return (
      <div className="rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-6 text-sm shadow-[0_4px_0_var(--color-ink)]">
        board not found.
        <button onClick={() => navigate('/mid')} className="ml-3 rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1 text-sm">
          ← back to boards
        </button>
      </div>
    )
  }

  const owner = bots.find((b) => b.boardId === board.id)
  const ownerCat = owner ? BOTS.find((c) => c.id === owner.type) : null
  const stuck = !hasMoves(board.tiles, board.gridSize)
  const showPlayerRestartOverlay = stuck && canPlayerMove

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)] lg:items-stretch lg:gap-6">
      <section className="flex min-h-0 flex-col gap-4 rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-5 shadow-[0_5px_0_var(--color-ink)]">
        <div className="shrink-0 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-ink)]/15 pb-4">
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => navigate('/mid')} className="text-xs underline opacity-70">
              ← all boards
            </button>
            <h2 className="mt-1 font-serif text-3xl tracking-tight">
              <EditableName value={board.name} onSave={(name) => renameBoard(board.id, name)} />
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              <span className="tabular-nums">{board.gridSize}×{board.gridSize}</span>
              <span className="mx-2 text-[var(--color-ink)]/30">·</span>
              score <span className="font-medium text-[var(--color-ink)]">{board.score.toLocaleString()}</span>
              <span className="mx-2 text-[var(--color-ink)]/30">·</span>
              <span className="tabular-nums">{board.movesSinceRestart}</span> moves this run
            </p>
          </div>
          <div className="flex flex-wrap items-start justify-end gap-2">
            <Money />
            <span
              className="rounded-full border border-[var(--color-ink)] bg-[var(--color-paper2)] px-3 py-1 text-sm tabular-nums"
              title="Lifetime points across all prestiges"
            >
              lifetime {lifetimeTotalPts.toLocaleString()} pts
            </span>
          </div>
        </div>

        <div className="shrink-0 text-xs text-[var(--color-ink-soft)]">
          <p>
            <span className="font-semibold text-[var(--color-ink)]">Controls:</span> WASD · arrows · swipe · pad below
          </p>
          {!isManual && (
            <p className="mt-1">You can move here alongside the assigned bot — both affect this grid.</p>
          )}
        </div>

        <div className="relative min-h-0 min-w-0 flex-1">
          <Board
            tiles={board.tiles}
            gridSize={board.gridSize}
            onMove={canPlayerMove ? move : undefined}
            reducedMotion={reducedMotion}
            ariaLabel={`${board.name} board`}
          />
          {showPlayerRestartOverlay && (
            <div className="absolute inset-2 grid place-items-center rounded-xl bg-[var(--color-paper)]/95">
              <div className="rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-pink)] p-4 text-center">
                <p className="font-serif text-2xl">no moves left</p>
                <button
                  type="button"
                  onClick={() => restartManual(board.id)}
                  disabled={autorestarts.current <= 0}
                  className="mt-3 rounded-lg border border-[var(--color-ink)] bg-[var(--color-mint)] px-4 py-2 disabled:opacity-50"
                >
                  restart (uses 1)
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="flex min-h-0 h-full flex-col overflow-hidden rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-paper2)] shadow-[0_5px_0_var(--color-ink)]">
        <div className="flex min-h-0 flex-1 flex-col border-b border-[var(--color-ink)]/12 bg-[var(--color-paper)] px-4 pb-4 pt-4">
          <p className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
            Who plays
          </p>
          <p className="mt-1 shrink-0 font-serif text-lg text-[var(--color-ink)]">Assign driver</p>
          <div className="mt-3 shrink-0">
            <AssignBotDropdown boardId={board.id} />
          </div>
          {owner && ownerCat ? (
            <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col">
              <div
                className="flex min-h-[8rem] flex-1 flex-col overflow-y-auto overscroll-y-contain rounded-2xl border-2 border-[var(--color-ink)]/90 p-4 text-sm shadow-[0_3px_0_var(--color-ink)]"
                style={{
                  background: `linear-gradient(145deg, ${ownerCat.color ?? 'var(--color-lilac)'} 0%, var(--color-lilac) 55%, var(--color-paper) 100%)`,
                }}
              >
                <div className="flex min-h-0 flex-1 items-start gap-3">
                  <span
                    className="mt-1 h-10 w-1 shrink-0 rounded-full bg-[var(--color-ink)]/25"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg font-semibold leading-tight">{botTitleLine(owner, ownerCat)}</p>
                    <p className="mt-1 text-xs leading-snug text-[var(--color-ink-soft)]">{ownerCat.algo}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--color-ink)]/20 bg-white/80 px-2.5 py-0.5 font-mono text-xs">
                        {ownerCat.mps?.toFixed(1) ?? '?'} m/s
                      </span>
                      <span className="rounded-full border border-[var(--color-ink)]/20 bg-white/80 px-2.5 py-0.5 font-mono text-xs">
                        {owner.lifetime.moves.toLocaleString()} moves
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={owner.enabled}
                        onClick={() => setBotEnabled(owner.uid, !owner.enabled)}
                        className={`rounded-full border-2 border-[var(--color-ink)] px-2.5 py-0.5 text-xs font-semibold ${
                          owner.enabled ? 'bg-[var(--color-mint)]' : 'bg-white text-[var(--color-ink-soft)]'
                        }`}
                      >
                        {owner.enabled ? 'on' : 'off'}
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-[var(--color-ink)]/25 bg-white/85 px-2 py-1.5">
                        <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-soft)]">merges</p>
                        <p className="font-mono text-xs leading-tight">{owner.lifetime.merges.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border border-[var(--color-ink)]/25 bg-white/85 px-2 py-1.5">
                        <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-soft)]">restarts</p>
                        <p className="font-mono text-xs leading-tight">
                          {owner.lifetime.restartsUsed.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink)]/80">
                      Quick upgrades
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {BOT_UPGRADE_DEFS.map((u) => {
                        const level = owner.upgrades[u.kind]
                        const max = upgradeMaxLevelFor(u.kind)
                        const cost = upgradeCostFor(u.kind, level, ownerCat.cost ?? 0)
                        const canBuy = level < max && points >= cost
                        return (
                          <li
                            key={u.kind}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-ink)]/25 bg-white/90 px-2 py-1"
                          >
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold capitalize" title={u.effect}>
                              {u.label}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] text-[var(--color-ink-soft)]">
                              {level}/{max}
                            </span>
                            <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--color-ink-soft)]">
                              {cost.toLocaleString()}
                            </span>
                            <button
                              type="button"
                              disabled={!canBuy}
                              onClick={() => buyUpgrade(owner.uid, u.kind)}
                              title={u.effect}
                              className="shrink-0 rounded-md border border-[var(--color-ink)] bg-white px-1.5 py-0.5 text-[10px] font-semibold shadow-[0_1px_0_var(--color-ink)] transition hover:bg-[var(--color-paper)] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              {level >= max ? 'max' : '+1'}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    <p className="mt-2 text-[10px] leading-snug text-[var(--color-ink-soft)]">
                      Fuse, sell, and full upgrade breakdown live on bot profile.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/bot/${owner.uid}`)}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border-2 border-[var(--color-ink)] bg-white px-3 py-1.5 text-xs font-semibold shadow-[0_2px_0_var(--color-ink)] transition hover:bg-[var(--color-paper)] active:translate-y-px active:shadow-none"
                    >
                      Bot profile
                      <span aria-hidden>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="mt-4 min-h-[4rem] flex-1 rounded-xl border border-dashed border-[var(--color-ink)]/25 bg-[var(--color-paper)]/50"
              aria-hidden
            />
          )}
        </div>

        <div className="shrink-0 px-4 py-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]">
            Grid size
          </p>
          <p className="mt-1 font-serif text-lg text-[var(--color-ink)]">Dimensions</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[4, 5, 6, 7, 8, 9].map((s) => {
              const enabled = unlockedSizes.includes(s as GridSize)
              const active = board.gridSize === s
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!enabled || active}
                  onClick={() => changeSize(board.id, s as GridSize)}
                  title={!enabled ? 'Unlock in research' : active ? 'Current size' : `Switch to ${s}×${s}`}
                  className={`relative min-h-[2.5rem] rounded-xl border-2 text-sm font-semibold transition ${
                    active
                      ? 'border-[var(--color-ink)] bg-[var(--color-mint)] shadow-[0_2px_0_var(--color-ink)]'
                      : enabled
                        ? 'border-[var(--color-ink)]/35 bg-white shadow-[0_2px_0_var(--color-ink)]/40 hover:border-[var(--color-ink)] hover:bg-[var(--color-peach)]/30'
                        : 'cursor-not-allowed border-[var(--color-ink)]/15 bg-[var(--color-paper)]/80 text-[var(--color-ink-soft)] opacity-70'
                  }`}
                >
                  <span className="tabular-nums">{s}×{s}</span>
                  {!enabled && (
                    <svg
                      className="absolute right-1.5 top-1.5 h-3.5 w-3.5 opacity-45"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-ink-soft)]">
            Larger grids unlock from the <span className="font-medium text-[var(--color-ink)]">research tree</span>.
          </p>
        </div>
      </aside>
    </div>
  )
}
