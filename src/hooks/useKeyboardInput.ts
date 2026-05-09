import { useEffect } from 'react'
import type { Direction } from '../game/types'

const KEY_MAP: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  h: 'left',
  H: 'left',
  l: 'right',
  L: 'right',
  k: 'up',
  K: 'up',
  j: 'down',
  J: 'down',
}

const isInputFocused = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (target.isContentEditable) return true
  return false
}

export const useKeyboardInput = (
  onMove: ((dir: Direction) => void) | undefined,
  active = true,
) => {
  useEffect(() => {
    if (!active || !onMove) return
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isInputFocused(e.target)) return
      const dir = KEY_MAP[e.key]
      if (!dir) return
      e.preventDefault()
      onMove(dir)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onMove, active])
}
