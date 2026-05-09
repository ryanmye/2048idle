import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

const tween = (
  from: number,
  to: number,
  reduceMotion: boolean,
  setValue: (v: number) => void,
): (() => void) => {
  if (reduceMotion || from === to) {
    setValue(to)
    return () => {}
  }
  const duration = 320
  const start = performance.now()
  let frame = 0
  const step = (t: number) => {
    const p = Math.min(1, (t - start) / duration)
    const eased = 1 - (1 - p) ** 3
    setValue(from + (to - from) * eased)
    if (p < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
  return () => cancelAnimationFrame(frame)
}

const useTweenedNumber = (target: number, reduceMotion: boolean): number => {
  const [display, setDisplay] = useState(target)
  const last = useRef(target)
  useEffect(() => {
    const cancel = tween(last.current, target, reduceMotion, setDisplay)
    last.current = target
    return cancel
  }, [target, reduceMotion])
  return display
}

export function Money() {
  const points = useGameStore((s) => s.points)
  const prestigeTokens = useGameStore((s) => s.prestigeTokens)
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)
  const tweenedPts = useTweenedNumber(points, reducedMotion)
  return (
    <div className="flex gap-2 text-sm">
      <span className="rounded-full border border-[var(--color-ink)] bg-[var(--color-butter)] px-3 py-1" aria-live="polite">
        ⬢ {Math.floor(tweenedPts).toLocaleString()} pts
      </span>
      <span className="rounded-full border border-[var(--color-ink)] bg-[var(--color-lilac)] px-3 py-1">
        ◆ {prestigeTokens.toLocaleString()} prestige
      </span>
    </div>
  )
}
