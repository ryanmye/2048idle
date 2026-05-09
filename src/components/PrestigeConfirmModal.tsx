import { BALANCE } from '../data/balance'
import { calculatePrestigeTokens } from '../game/prestige'
import { useGameStore } from '../store/useGameStore'
import { Modal } from './Modal'

export function PrestigeConfirmModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lifetime = useGameStore((s) => s.lifetime)
  const prestigeLevel = useGameStore((s) => s.prestigeLevel)
  const prestigeTokens = useGameStore((s) => s.prestigeTokens)
  const prestige = useGameStore((s) => s.prestige)
  const earned = calculatePrestigeTokens(lifetime.totalPts)
  const eligible = lifetime.totalPts >= BALANCE.prestige.minimumTotalPts

  return (
    <Modal open={open} onClose={onClose} title="prestige?">
      <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
        Resets your run, banks tokens for the research tree.
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-mint)] p-3">
          <div className="font-bold">tokens earned</div>
          <div className="font-mono text-lg">+{earned} ◆</div>
          <div className="text-xs opacity-70">total: {(prestigeTokens + earned).toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-butter)] p-3">
          <div className="font-bold">prestige level</div>
          <div className="font-mono text-lg">{prestigeLevel} → {prestigeLevel + 1}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-pink)] p-3">
          <div className="font-bold">resets:</div>
          <ul className="mt-1 list-inside list-disc opacity-90">
            <li>points</li>
            <li>boards & bots</li>
            <li>autorestarts</li>
            <li>achievement effects</li>
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-sky)] p-3">
          <div className="font-bold">kept:</div>
          <ul className="mt-1 list-inside list-disc opacity-90">
            <li>prestige tokens & level</li>
            <li>research nodes & their effects</li>
            <li>unlocked bot types & board sizes</li>
            <li>achievement medals & board names</li>
          </ul>
        </div>
      </div>
      {!eligible && (
        <div className="mt-4 rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-3 text-sm">
          Need {BALANCE.prestige.minimumTotalPts.toLocaleString()} lifetime pts to prestige. Currently:
          {' '}
          {Math.floor(lifetime.totalPts).toLocaleString()}.
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-[var(--color-ink)] bg-white px-4 py-2">
          cancel
        </button>
        <button
          onClick={() => {
            prestige()
            onClose()
          }}
          disabled={!eligible || earned <= 0}
          className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-coral)] px-4 py-2 text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          prestige now
        </button>
      </div>
    </Modal>
  )
}
