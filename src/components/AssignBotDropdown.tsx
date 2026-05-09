import { useEffect, useId, useRef, useState } from 'react'
import { BOTS } from '../data/bots'
import { botTitleLine } from '../game/botLabel'
import { useGameStore } from '../store/useGameStore'
import { BotRenameInline } from './BotRenameInline'

export function AssignBotDropdown({ boardId }: { boardId: string }) {
  const board = useGameStore((s) => s.boards.find((b) => b.id === boardId))
  const bots = useGameStore((s) => s.bots)
  const assignBot = useGameStore((s) => s.assignBot)
  const unassignBot = useGameStore((s) => s.unassignBot)

  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!board) return null

  const choose = (value: string) => {
    if (value === 'manual') {
      if (board.ownerBotId !== 'manual') unassignBot(board.ownerBotId)
    } else {
      assignBot(value, boardId)
    }
    setOpen(false)
  }

  const currentLabel = () => {
    if (board.ownerBotId === 'manual') return 'You — manual'
    const b = bots.find((x) => x.uid === board.ownerBotId)
    const cat = b ? BOTS.find((c) => c.id === b.type) : null
    if (!b) return 'Bot'
    return botTitleLine(b, cat ?? undefined)
  }

  const currentSub =
    board.ownerBotId !== 'manual'
      ? (() => {
          const b = bots.find((x) => x.uid === board.ownerBotId)
          if (!b?.boardId || b.boardId === boardId) return 'Assigned here'
          return 'Was on another board — moved here'
        })()
      : 'Keyboard & swipe only'

  return (
    <div ref={rootRef} className="relative min-h-0 w-full">
      <button
        type="button"
        id={`${listId}-trigger`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-[var(--color-ink)] bg-white px-3.5 py-3 text-left shadow-[0_2px_0_var(--color-ink)] transition hover:bg-[var(--color-paper)] active:translate-y-px active:shadow-none"
      >
        <span className="min-w-0">
          <span className="block truncate font-semibold text-[var(--color-ink)]">{currentLabel()}</span>
          <span className="mt-0.5 block truncate text-xs text-[var(--color-ink-soft)]">{currentSub}</span>
        </span>
        <span
          className={`shrink-0 text-[var(--color-ink-soft)] transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={`${listId}-trigger`}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,calc(100vh-8rem))] min-h-0 overflow-y-auto overscroll-y-contain rounded-xl border-2 border-[var(--color-ink)] bg-[var(--color-paper)] py-1 shadow-[0_8px_0_var(--color-ink)]"
        >
          <button
            type="button"
            role="option"
            aria-selected={board.ownerBotId === 'manual'}
            onClick={() => choose('manual')}
            className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition hover:bg-[var(--color-peach)]/50 ${
              board.ownerBotId === 'manual' ? 'bg-[var(--color-mint)]/40 font-semibold' : ''
            }`}
          >
            <span>You — manual</span>
            <span className="text-xs font-normal text-[var(--color-ink-soft)]">Play yourself from this page</span>
          </button>

          {bots.length > 0 && (
            <div className="mx-2 my-1 h-px bg-[var(--color-ink)]/15" aria-hidden />
          )}

          {bots.map((b) => {
            const cat = BOTS.find((c) => c.id === b.type)
            const onOther = b.boardId && b.boardId !== boardId
            const selected = board.ownerBotId === b.uid
            const catalogName = cat?.name ?? b.type
            return (
              <div
                key={b.uid}
                className={`flex w-full items-start gap-1 px-2 py-1.5 transition hover:bg-[var(--color-lilac)]/40 ${
                  selected ? 'bg-[var(--color-lilac)]/50' : ''
                }`}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(b.uid)}
                  className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-lg py-1 pl-1 pr-0 text-left text-sm font-semibold focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
                >
                  <span className="flex w-full min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: cat?.color ?? 'var(--color-ink)' }}
                    />
                    <span className="min-w-0 truncate">{botTitleLine(b, cat)}</span>
                    {selected && (
                      <span className="ml-auto shrink-0 text-xs font-normal text-[var(--color-ink-soft)]">active</span>
                    )}
                  </span>
                  <span className="pl-4 text-xs font-normal text-[var(--color-ink-soft)]">
                    {onOther ? 'Will move from another board' : cat?.algo ?? ''}
                  </span>
                </button>
                <BotRenameInline botUid={b.uid} catalogName={catalogName} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
