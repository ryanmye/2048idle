import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { canAccessLate, canAccessMid } from '../game/navigationUnlock'
import { useGameStore } from '../store/useGameStore'

const TAB_ROUTES = ['/', '/mid', '/late', '/bot', '/shop', '/research', '/stats']

const isInputFocused = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

export const useGlobalShortcuts = (toggleHelp: () => void) => {
  const navigate = useNavigate()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isInputFocused(e.target)) return
      if (e.key === '?') {
        e.preventDefault()
        toggleHelp()
        return
      }
      const idx = ['1', '2', '3', '4', '5', '6', '7'].indexOf(e.key)
      if (idx >= 0) {
        const route = TAB_ROUTES[idx]
        const st = useGameStore.getState()
        if (route === '/mid' && !canAccessMid(st)) return
        if (route === '/late' && !canAccessLate(st)) return
        e.preventDefault()
        navigate(route)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, toggleHelp])
}
