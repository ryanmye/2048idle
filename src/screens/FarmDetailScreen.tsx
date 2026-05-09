import { useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Board } from '../components/Board'
import { EditableName } from '../components/EditableName'
import { Money } from '../components/Money'
import { Sparkline } from '../components/Sparkline'
import { BOTS } from '../data/bots'
import { botTitleLine } from '../game/botLabel'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useGameStore } from '../store/useGameStore'

export function FarmDetailScreen() {
  const { farmId } = useParams<{ farmId: string }>()
  const navigate = useNavigate()
  const boards = useGameStore((s) => s.boards)
  const bots = useGameStore((s) => s.bots)
  const farms = useGameStore((s) => s.farms)
  const pointsHistory = useGameStore((s) => s.pointsHistory)
  const renameBoard = useGameStore((s) => s.renameBoard)
  const renameFarm = useGameStore((s) => s.renameFarm)
  const setBoardFarm = useGameStore((s) => s.setBoardFarm)
  const reducedMotion = useReducedMotion()

  const farm = farms.find((f) => f.id === farmId)
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

  if (!farmId || !farm) {
    return <Navigate to="/late" replace />
  }

  const farmBoards = farm.boardIds
    .map((id) => boards.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => !!b)

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/late')}
              className="rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1 text-sm hover:bg-[var(--color-paper2)]"
            >
              ← farms
            </button>
            <h2 className="font-serif text-2xl">
              <EditableName value={farm.name} onSave={(name) => renameFarm(farm.id, name)} />
            </h2>
          </div>
          <Money />
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {farmBoards.length} board{farmBoards.length === 1 ? '' : 's'} in this farm ·{' '}
          <Link to="/late" className="underline">
            all farms
          </Link>
        </p>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {farmBoards.map((board) => (
            <button
              key={board.id}
              type="button"
              onClick={() => navigate(`/board/${board.id}`)}
              className="group rounded-xl border border-[var(--color-ink)] bg-white p-2 text-left transition-shadow hover:shadow-[0_3px_0_var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:outline-none"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" onClick={(e) => e.stopPropagation()}>
                  <EditableName value={board.name} onSave={(name) => renameBoard(board.id, name)} />
                </p>
                <span className="text-[10px] uppercase text-[var(--color-ink-soft)]">
                  {board.gridSize}×{board.gridSize}
                </span>
              </div>
              <Board tiles={board.tiles} gridSize={board.gridSize} compact reducedMotion={reducedMotion} />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="rounded-full border border-[var(--color-ink)] bg-[var(--color-paper2)] px-2 py-0.5">
                  {ownerLabel(board.id)}
                </span>
                <span className="font-mono">
                  {ownerMps(board.id).toFixed(1)} m/s · {board.score.toLocaleString()} pts
                </span>
              </div>
            </button>
          ))}
        </div>

        {farmBoards.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">no boards assigned yet — pick from other boards below.</p>
        )}

        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            Production · last {pointsHistory.length}s
          </p>
          <Sparkline points={pointsHistory.length ? pointsHistory : [0, 0, 0]} />
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-xl">other boards</h3>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Boards not in any farm. Add to this farm or leave unassigned.
          </p>
          {unfiledBoards.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)]">all boards are in a farm.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {unfiledBoards.map((board) => (
                <div
                  key={board.id}
                  className="rounded-xl border border-[var(--color-ink)] bg-white p-2 shadow-[0_2px_0_var(--color-ink)]/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{board.name}</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/board/${board.id}`)}
                      className="shrink-0 rounded border border-[var(--color-ink)] bg-[var(--color-paper2)] px-2 py-0.5 text-xs"
                    >
                      open
                    </button>
                  </div>
                  <Board tiles={board.tiles} gridSize={board.gridSize} compact reducedMotion={reducedMotion} />
                  <button
                    type="button"
                    onClick={() => setBoardFarm(board.id, farm.id)}
                    className="mt-2 w-full rounded-lg border border-[var(--color-ink)] bg-[var(--color-mint)] px-2 py-1 text-xs font-medium"
                  >
                    add to this farm
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <aside className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-butter)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Farm</p>
          <p className="font-serif text-lg">{farm.name}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">{farmBoards.length} boards here</p>
        </div>
      </aside>
    </div>
  )
}
