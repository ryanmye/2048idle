import { AnimatePresence, motion } from 'framer-motion'
import { useRef } from 'react'
import type { Direction, Tile } from '../game/types'

const tileColor = (value: number): { bg: string; fg: string } => {
  if (value === 2) return { bg: '#f6ecd8', fg: 'var(--color-ink)' }
  if (value === 4) return { bg: 'var(--color-peach)', fg: 'var(--color-ink)' }
  if (value === 8) return { bg: 'var(--color-pink)', fg: 'var(--color-ink)' }
  if (value === 16) return { bg: 'var(--color-coral)', fg: 'var(--color-paper)' }
  if (value === 32) return { bg: 'var(--color-butter)', fg: 'var(--color-ink)' }
  if (value === 64) return { bg: 'var(--color-mint)', fg: 'var(--color-ink)' }
  if (value === 128) return { bg: 'var(--color-sky)', fg: 'var(--color-ink)' }
  if (value === 256) return { bg: 'var(--color-lilac)', fg: 'var(--color-ink)' }
  if (value === 512) return { bg: 'var(--color-sage)', fg: 'var(--color-paper)' }
  if (value === 1024) return { bg: '#7a9a73', fg: 'var(--color-paper)' }
  if (value === 2048) return { bg: '#587755', fg: 'var(--color-paper)' }
  if (value === 4096) return { bg: '#3f5d40', fg: 'var(--color-paper)' }
  if (value === 8192) return { bg: '#2a3f2f', fg: 'var(--color-paper)' }
  if (value === 16384) return { bg: '#1c2820', fg: 'var(--color-butter)' }
  return { bg: '#0f1614', fg: 'var(--color-coral)' }
}

const fontSizeFor = (value: number, compact: boolean): string => {
  const digits = String(value).length
  if (compact) {
    if (digits >= 5) return 'text-[10px]'
    if (digits >= 4) return 'text-[11px]'
    if (digits >= 3) return 'text-xs'
    return 'text-sm'
  }
  if (digits >= 5) return 'text-xs'
  if (digits >= 4) return 'text-base'
  if (digits >= 3) return 'text-lg'
  return 'text-xl'
}

interface BoardProps {
  tiles: Tile[]
  gridSize: number
  onMove?: (direction: Direction) => void
  compact?: boolean
  showButtons?: boolean
  reducedMotion?: boolean
  ariaLabel?: string
}

export function Board({
  tiles,
  gridSize,
  onMove,
  compact = false,
  showButtons = true,
  reducedMotion = false,
  ariaLabel,
}: BoardProps) {
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    startRef.current = { x: t.clientX, y: t.clientY }
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!onMove || !startRef.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - startRef.current.x
    const dy = t.clientY - startRef.current.y
    startRef.current = null
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    const threshold = compact ? 18 : 30
    if (Math.max(adx, ady) < threshold) return
    if (adx > ady) onMove(dx > 0 ? 'right' : 'left')
    else onMove(dy > 0 ? 'down' : 'up')
  }

  const cellPctX = 100 / gridSize
  const cellPctY = 100 / gridSize

  return (
    <div className="space-y-3" aria-label={ariaLabel} role={onMove ? 'application' : undefined}>
      <div
        className="relative rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-2 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => (
            <div
              key={`bg-${i}`}
              className="aspect-square rounded-md border border-dashed border-[var(--color-ink-soft)]/30"
            />
          ))}
        </div>
        <div className="absolute inset-2 pointer-events-none">
          <AnimatePresence>
            {tiles.map((t) => {
              const colors = tileColor(t.value)
              const sizeCls = fontSizeFor(t.value, compact)
              return (
                <motion.div
                  key={t.id}
                  layout={false}
                  initial={
                    reducedMotion
                      ? false
                      : t.fresh
                        ? {
                            left: `${t.col * cellPctX}%`,
                            top: `${t.row * cellPctY}%`,
                            scale: 0.72,
                            opacity: 0,
                          }
                        : {
                            left: `${t.col * cellPctX}%`,
                            top: `${t.row * cellPctY}%`,
                            scale: 1,
                            opacity: 1,
                          }
                  }
                  animate={
                    { left: `${t.col * cellPctX}%`, top: `${t.row * cellPctY}%`, opacity: 1, scale: 1 }
                  }
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.08 } }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.09,
                    ease: 'easeOut',
                  }}
                  id={`tile-${t.id}`}
                  className={`absolute flex items-center justify-center rounded-md border border-[var(--color-ink)] font-bold ${sizeCls}`}
                  style={{
                    width: `${cellPctX}%`,
                    height: `${cellPctY}%`,
                    padding: '3px',
                    background: colors.bg,
                    color: colors.fg,
                  }}
                >
                  <span style={{ width: '100%', height: '100%' }} className="flex items-center justify-center rounded-md">
                    {t.value}
                  </span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
      {onMove && showButtons && (
        <div className="flex justify-center gap-2">
          {(['left', 'up', 'down', 'right'] as const).map((d) => (
            <button
              key={d}
              onClick={() => onMove(d)}
              aria-label={`move ${d}`}
              className="rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1 text-sm capitalize hover:bg-[var(--color-paper2)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:outline-none"
            >
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
