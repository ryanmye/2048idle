import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { canAccessLate, canAccessMid } from '../game/navigationUnlock'
import { useGameStore } from '../store/useGameStore'

export function RequireMid({ children }: { children: ReactNode }) {
  const allowed = useGameStore((s) => canAccessMid({ boardSlots: s.boardSlots }))
  if (!allowed) return <Navigate to="/" replace />
  return <>{children}</>
}

export function RequireLate({ children }: { children: ReactNode }) {
  const allowed = useGameStore((s) => canAccessLate({ lifetime: s.lifetime }))
  if (!allowed) return <Navigate to="/" replace />
  return <>{children}</>
}
