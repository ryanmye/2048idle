import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'

/** Idle sim doesn’t need display refresh rate; 10 Hz keeps bots responsive without melting CPU / localStorage. */
const TICK_INTERVAL_MS = 100

export const useGameLoop = () => {
  const tick = useGameStore((s) => s.tick)
  useEffect(() => {
    const id = window.setInterval(() => {
      tick(Date.now())
    }, TICK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [tick])
}
