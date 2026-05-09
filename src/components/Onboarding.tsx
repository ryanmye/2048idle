import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore'

const STORAGE_KEY = 'idle2048:onboarding-seen'

const STEPS = [
  {
    id: 'welcome',
    title: 'welcome',
    body: 'use arrow keys, WASD, or swipe to combine matching tiles. reach 64 to unlock your first bot.',
    show: () => true,
  },
  {
    id: 'unlocked-bot',
    title: 'first bot unlocked',
    body: 'open the shop (5) and buy Random Walker — it’ll play a board for you while you idle.',
    show: (s: ReturnType<typeof useGameStore.getState>) =>
      s.unlockedBotTypes.includes('rand') && s.bots.length === 0,
  },
  {
    id: 'first-bot',
    title: 'assign your bot',
    body: 'click into a board (Mid screen) and assign your bot via the owner dropdown.',
    show: (s: ReturnType<typeof useGameStore.getState>) => s.bots.length > 0 && s.lifetime.totalMoves > 5,
  },
] as const

const initialSeen = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function Onboarding() {
  const state = useGameStore((s) => s)
  const [seen, setSeen] = useState<Record<string, boolean>>(initialSeen)
  const active = STEPS.find((s) => !seen[s.id] && s.show(state))

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
    } catch {
      // ignore
    }
  }, [seen])

  if (!active) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-30 flex justify-center px-4">
      <div className="pointer-events-auto max-w-md rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-butter)] p-4 shadow-md">
        <p className="font-serif text-lg">{active.title}</p>
        <p className="mt-1 text-sm">{active.body}</p>
        <button
          onClick={() => setSeen((cur) => ({ ...cur, [active.id]: true }))}
          className="mt-3 rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1 text-sm"
        >
          got it
        </button>
      </div>
    </div>
  )
}
