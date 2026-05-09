import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'
import { sounds } from '../utils/audio'

export const useToastAudio = () => {
  const toasts = useGameStore((s) => s.toasts)
  const enabled = useGameStore((s) => s.settings.soundEnabled)
  const seen = useRef(new Set<string>())
  useEffect(() => {
    for (const t of toasts) {
      if (seen.current.has(t.id)) continue
      seen.current.add(t.id)
      if (t.kind === 'achievement') sounds.achievement(enabled)
      else if (t.kind === 'prestige') sounds.prestige(enabled)
    }
  }, [toasts, enabled])
}
