import { useEffect, useRef, useState } from 'react'

export function EditableName({
  value,
  onSave,
  className,
  ariaLabel,
}: {
  value: string
  onSave: (value: string) => void
  className?: string
  ariaLabel?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      ref.current.select()
    }
  }, [editing])

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        aria-label={ariaLabel ?? 'rename'}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          onSave(draft.trim() || value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setEditing(false)
            onSave(draft.trim() || value)
          }
          if (e.key === 'Escape') {
            setEditing(false)
            setDraft(value)
          }
        }}
        className="rounded border border-[var(--color-ink)] bg-white px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
      />
    )
  }

  return (
    <button
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      aria-label={ariaLabel ?? `rename ${value}`}
      className={`border-b border-dashed border-[var(--color-ink-soft)] text-left hover:text-[var(--color-coral)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:outline-none ${className ?? ''}`}
    >
      {value}
    </button>
  )
}
