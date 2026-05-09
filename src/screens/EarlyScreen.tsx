import { useNavigate } from 'react-router-dom'
import { Board } from '../components/Board'
import { EditableName } from '../components/EditableName'
import { Money } from '../components/Money'
import { hasMoves } from '../game/grid'
import { useKeyboardInput } from '../hooks/useKeyboardInput'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useGameStore } from '../store/useGameStore'

export function EarlyScreen() {
  const board = useGameStore((s) => s.boards[0])
  const renameBoard = useGameStore((s) => s.renameBoard)
  const moveBoard = useGameStore((s) => s.moveBoard)
  const restartManual = useGameStore((s) => s.restartManualBoard)
  const rage = useGameStore((s) => s.rage)
  const autorestarts = useGameStore((s) => s.autorestarts)
  const unlocked = useGameStore((s) => s.unlockedBotTypes.includes('rand'))
  const reducedMotion = useReducedMotion()
  const navigate = useNavigate()

  const move = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (!board) return
    moveBoard(board.id, dir)
  }

  useKeyboardInput(board && board.ownerBotId === 'manual' ? move : undefined, !!board)

  if (!board) return null
  const stuck = !hasMoves(board.tiles, board.gridSize)

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">
            <EditableName value={board.name} onSave={(name) => renameBoard(board.id, name)} />
          </h2>
          <Money />
        </div>
        <div className="relative">
          <Board
            tiles={board.tiles}
            gridSize={board.gridSize}
            onMove={move}
            reducedMotion={reducedMotion}
            ariaLabel="manual 2048 board"
          />
          {stuck && (
            <div className="absolute inset-2 grid place-items-center rounded-xl bg-[var(--color-paper)]/95">
              <div className="rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-pink)] p-4 text-center">
                <p className="font-serif text-2xl">no moves left</p>
                <p className="mt-1 text-sm">
                  use 1 autorestart to refresh ({autorestarts.current}/{autorestarts.max})
                </p>
                <button
                  onClick={() => restartManual(board.id)}
                  disabled={autorestarts.current <= 0}
                  className="mt-3 rounded-lg border border-[var(--color-ink)] bg-[var(--color-mint)] px-4 py-2 disabled:opacity-50"
                >
                  restart
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-pink)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Rage meter</p>
          <div className="mt-2 h-3 rounded bg-white">
            <div className="h-3 rounded bg-[var(--color-coral)] transition-all" style={{ width: `${Math.round(rage.meter * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs">{Math.round(rage.meter * 100)}% · fill it to trigger ×3 bot speed</p>
        </div>
        <p className="text-xs text-[var(--color-ink-soft)]">tip: use arrow keys, WASD, or hjkl. swipe on touch.</p>
      </section>
      <section className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <h3 className="font-serif text-xl">your first bot</h3>
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-butter)] p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Random Walker</p>
              <p className="text-xs text-[var(--color-ink-soft)]">COMMON · TIER I</p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded border border-dashed border-[var(--color-ink)] font-mono text-xs">rand</div>
          </div>
          <p className="mt-2 text-sm">0.5 moves/sec · uniform random direction</p>
          <p className="mt-1 text-xs">Unlock condition: reach a 64 tile manually</p>
          <button
            disabled={!unlocked}
            onClick={() => navigate('/shop')}
            className="mt-2 rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1 text-sm hover:bg-[var(--color-paper2)] disabled:opacity-50"
          >
            {unlocked ? 'visit shop →' : 'locked'}
          </button>
        </div>
      </section>
    </div>
  )
}
