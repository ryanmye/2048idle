import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Board } from '../components/Board'
import { EditableName } from '../components/EditableName'
import { Money } from '../components/Money'
import { Sparkline } from '../components/Sparkline'
import { BOTS } from '../data/bots'
import { botTitleLine } from '../game/botLabel'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useGameStore } from '../store/useGameStore'

export function LateScreen() {
  const navigate = useNavigate()
  const boards = useGameStore((s) => s.boards)
  const bots = useGameStore((s) => s.bots)
  const farms = useGameStore((s) => s.farms)
  const auto = useGameStore((s) => s.autorestarts)
  const points = useGameStore((s) => s.points)
  const pointsHistory = useGameStore((s) => s.pointsHistory)
  const renameFarm = useGameStore((s) => s.renameFarm)
  const createFarm = useGameStore((s) => s.createFarm)
  const deleteFarm = useGameStore((s) => s.deleteFarm)
  const setBoardFarm = useGameStore((s) => s.setBoardFarm)
  const offlineBonus = useGameStore((s) => s.offlineRateBonusPct)
  const [newName, setNewName] = useState('')
  const reducedMotion = useReducedMotion()

  const totalMps = bots.reduce((sum, b) => {
    const cat = BOTS.find((c) => c.id === b.type)
    return sum + (cat?.mps ?? 0)
  }, 0)

  const farmColor = (i: number) =>
    ['var(--color-mint)', 'var(--color-sky)', 'var(--color-pink)', 'var(--color-butter)', 'var(--color-lilac)'][i % 5]

  const inAnyFarm = useMemo(() => new Set(farms.flatMap((f) => f.boardIds)), [farms])
  const unfiledBoards = useMemo(
    () => boards.filter((b) => !inAnyFarm.has(b.id)),
    [boards, inAnyFarm],
  )

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
          <h2 className="font-serif text-2xl">farms</h2>
          <Money />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="new farm name"
            className="rounded border border-[var(--color-ink)] bg-white px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (!newName.trim()) return
              createFarm(newName.trim())
              setNewName('')
            }}
            className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-mint)] px-3 py-1 text-sm"
          >
            + create farm
          </button>
        </div>
        {farms.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">
            no farms yet — create one, then assign boards from other boards below
          </p>
        )}
        {farms.map((farm, i) => (
          <div
            key={farm.id}
            className="rounded-xl border border-[var(--color-ink)] p-3 shadow-[0_2px_0_var(--color-ink)]/25"
            style={{ background: farmColor(i) }}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-serif text-lg">
                  <EditableName value={farm.name} onSave={(name) => renameFarm(farm.id, name)} />
                </p>
                <Link
                  to={`/late/farm/${farm.id}`}
                  className="text-sm font-medium text-[var(--color-ink)] underline decoration-[var(--color-ink-soft)] underline-offset-2 hover:decoration-[var(--color-ink)]"
                >
                  view boards →
                </Link>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => deleteFarm(farm.id)}
                  className="rounded border border-[var(--color-ink)] bg-white px-2 py-0.5 text-xs"
                >
                  remove
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {farm.boardIds.length === 0 && (
                <span className="text-xs italic text-[var(--color-ink-soft)]">no boards yet — use other boards below</span>
              )}
              {farm.boardIds.map((id) => {
                const board = boards.find((b) => b.id === id)
                if (!board) return null
                return (
                  <span key={id} className="rounded-full border border-[var(--color-ink)] bg-white px-2 py-0.5 text-xs">
                    {board.name}
                  </span>
                )
              })}
            </div>
          </div>
        ))}

        <div className="space-y-2 rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-3">
          <h3 className="font-serif text-xl">other boards</h3>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Boards not assigned to a farm. Open a board or add it to a farm.
          </p>
          {unfiledBoards.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)]">every board is in a farm.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {unfiledBoards.map((board) => (
                <div
                  key={board.id}
                  className="rounded-xl border border-[var(--color-ink)] bg-white p-2 shadow-[0_2px_0_var(--color-ink)]/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold">{board.name}</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/board/${board.id}`)}
                      className="shrink-0 rounded border border-[var(--color-ink)] bg-[var(--color-paper2)] px-2 py-0.5 text-xs"
                    >
                      open
                    </button>
                  </div>
                  <Board tiles={board.tiles} gridSize={board.gridSize} compact reducedMotion={reducedMotion} />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-ink-soft)]">
                    <span>{ownerLabel(board.id)}</span>
                    <span className="font-mono">{ownerMps(board.id).toFixed(1)} m/s</span>
                  </div>
                  {farms.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {farms.map((farm) => (
                        <button
                          key={farm.id}
                          type="button"
                          onClick={() => setBoardFarm(board.id, farm.id)}
                          className="rounded border border-[var(--color-ink)] bg-[var(--color-mint)] px-2 py-0.5 text-[10px] hover:brightness-105"
                        >
                          → {farm.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[10px] text-[var(--color-ink-soft)]">create a farm above to assign</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Production · last {pointsHistory.length}s</p>
          <Sparkline points={pointsHistory.length ? pointsHistory : [0, 0, 0]} />
        </div>
      </section>
      <aside className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-butter)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Total output</p>
          <p className="font-serif text-2xl">{totalMps.toFixed(1)} m/s · {Math.floor(points).toLocaleString()} pts</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Offline drain</p>
          <p className="text-sm">used stock while away</p>
          <p className="text-sm">pool: {auto.current}/{auto.max}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">offline bonus: +{offlineBonus}%</p>
        </div>
      </aside>
    </div>
  )
}
