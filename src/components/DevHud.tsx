import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

export function DevHud() {
  const enabled = typeof window !== 'undefined' && new URLSearchParams(location.search).has('dev')
  const showFps = useGameStore((s) => s.settings.showFps)
  const points = useGameStore((s) => s.points)
  const bots = useGameStore((s) => s.bots)
  const autorestarts = useGameStore((s) => s.autorestarts)
  const lifetime = useGameStore((s) => s.lifetime)
  const pointsHistory = useGameStore((s) => s.pointsHistory)
  const [fps, setFps] = useState(0)

  useEffect(() => {
    if (!enabled && !showFps) return
    let frames = 0
    let last = performance.now()
    let raf = 0
    const loop = (t: number) => {
      frames += 1
      if (t - last >= 1000) {
        setFps(frames)
        frames = 0
        last = t
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [enabled, showFps])

  if (!enabled && !showFps) return null
  const pps = pointsHistory.slice(-10).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(10, pointsHistory.length))

  return (
    <div className="fixed bottom-4 left-4 z-30 rounded-lg border border-[var(--color-ink)] bg-white/90 p-3 font-mono text-xs shadow">
      <div>fps {fps}</div>
      <div>pts {Math.floor(points).toLocaleString()}</div>
      <div>pps ~{pps.toFixed(1)}</div>
      <div>bots {bots.length}</div>
      <div>ar {autorestarts.current}/{autorestarts.max}</div>
      {enabled && (
        <>
          <div>moves {lifetime.totalMoves.toLocaleString()}</div>
          <div>merges {lifetime.totalMerges.toLocaleString()}</div>
          <div>finished {lifetime.boardsFinished.toLocaleString()}</div>
          <div className="mt-1 border-t border-[var(--color-ink-soft)]/30 pt-1">
            {bots.slice(0, 5).map((b) => (
              <div key={b.uid}>
                {b.type} budget {b.moveBudget.toFixed(1)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
