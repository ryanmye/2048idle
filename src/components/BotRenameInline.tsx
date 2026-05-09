import { useEffect, useId, useRef, useState } from 'react'
import { BALANCE } from '../data/balance'
import { useGameStore } from '../store/useGameStore'

/** Paid rename with explicit save — use inside dropdown rows (stopPropagation on container). */
export function BotRenameInline({
  botUid,
  catalogName,
}: {
  botUid: string
  catalogName: string
}) {
  const points = useGameStore((s) => s.points)
  const nickname = useGameStore((s) => s.bots.find((b) => b.uid === botUid)?.nickname ?? null)
  const renameBot = useGameStore((s) => s.renameBot)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelId = useId()
  const cost = BALANCE.bot.renameCostPts
  const canAfford = points >= cost

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [open])

  const openEdit = () => {
    setDraft(nickname ?? catalogName)
    setOpen(true)
  }

  const cancel = () => {
    setOpen(false)
    setDraft('')
  }

  const save = () => {
    renameBot(botUid, draft)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        title={`Rename (${cost.toLocaleString()} pts)`}
        aria-expanded={false}
        aria-controls={panelId}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openEdit()
        }}
        className="shrink-0 rounded-md border border-[var(--color-ink)]/35 bg-white/90 p-1 text-[var(--color-ink-soft)] transition hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
      >
        <span className="sr-only">Rename bot</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    )
  }

  return (
    <div
      id={panelId}
      role="group"
      aria-label="Rename bot"
      className="flex min-w-0 shrink-0 flex-col gap-1 rounded-lg border border-[var(--color-ink)]/25 bg-[var(--color-paper)] p-1.5 shadow-sm"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') cancel()
          if (e.key === 'Enter') save()
        }}
        className="w-full min-w-0 rounded border border-[var(--color-ink)]/40 bg-white px-2 py-1 text-xs"
        maxLength={48}
      />
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          disabled={!canAfford}
          onClick={(e) => {
            e.stopPropagation()
            save()
          }}
          className="rounded border border-[var(--color-ink)] bg-[var(--color-mint)] px-2 py-0.5 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-45"
        >
          Save ({cost} pts)
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            cancel()
          }}
          className="rounded border border-[var(--color-ink)]/40 bg-white px-2 py-0.5 text-[10px]"
        >
          Cancel
        </button>
      </div>
      {!canAfford && <p className="text-[10px] text-[var(--color-ink-soft)]">Need {cost.toLocaleString()} pts</p>}
    </div>
  )
}
