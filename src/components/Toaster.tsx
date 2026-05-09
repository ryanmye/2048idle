import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useGameStore } from '../store/useGameStore'

const KIND_BG: Record<string, string> = {
  achievement: 'var(--color-mint)',
  prestige: 'var(--color-lilac)',
  info: 'var(--color-sky)',
  warn: 'var(--color-coral)',
}

export function Toaster() {
  const toasts = useGameStore((s) => s.toasts)
  const dismiss = useGameStore((s) => s.dismissToast)

  useEffect(() => {
    if (!toasts.length) return
    const timeouts = toasts.map((t) =>
      setTimeout(() => dismiss(t.id), 5000),
    )
    return () => timeouts.forEach(clearTimeout)
  }, [toasts, dismiss])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.slice(-5).map((t) => (
          <motion.div
            key={t.id}
            role="status"
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            className="pointer-events-auto rounded-xl border border-[var(--color-ink)] px-4 py-3 shadow-md"
            style={{ background: KIND_BG[t.kind] ?? 'var(--color-butter)' }}
          >
            <button
              onClick={() => dismiss(t.id)}
              aria-label="dismiss"
              className="float-right -mr-2 -mt-2 rounded-full border border-[var(--color-ink)] bg-white px-2 text-xs"
            >
              ✕
            </button>
            <div className="font-serif text-base capitalize">
              {t.kind === 'achievement' ? '★ ' : t.kind === 'prestige' ? '◆ ' : ''}
              {t.title}
            </div>
            {t.body && <div className="text-sm opacity-80">{t.body}</div>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
