import { useSyncExternalStore } from 'react'
import { useGameStore } from '../store/useGameStore'

const subscribePrefersReduced = (cb: () => void): (() => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

const getPrefersReduced = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const useReducedMotion = (): boolean => {
  const setting = useGameStore((s) => s.settings.reducedMotion)
  const prefers = useSyncExternalStore(
    subscribePrefersReduced,
    getPrefersReduced,
    () => false,
  )
  return setting || prefers
}
