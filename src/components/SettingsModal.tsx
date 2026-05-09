import { useState } from 'react'
import { useGameStore } from '../store/useGameStore'
import { Modal } from './Modal'

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useGameStore((s) => s.settings)
  const setSettings = useGameStore((s) => s.setSettings)
  const exportSave = useGameStore((s) => s.exportSave)
  const importSave = useGameStore((s) => s.importSave)
  const hardReset = useGameStore((s) => s.hardReset)
  const [importOpen, setImportOpen] = useState(false)
  const [importValue, setImportValue] = useState('')
  const [exportValue, setExportValue] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="settings">
      <div className="space-y-4 text-sm">
        <Toggle
          label="reduced motion"
          on={settings.reducedMotion}
          onChange={(v) => setSettings({ reducedMotion: v })}
        />
        <Toggle
          label="sound"
          on={settings.soundEnabled}
          onChange={(v) => setSettings({ soundEnabled: v })}
        />
        <Toggle
          label="show fps"
          on={settings.showFps}
          onChange={(v) => setSettings({ showFps: v })}
        />
        <div className="flex items-center justify-between">
          <span>theme accent</span>
          <select
            value={settings.themeAccent}
            onChange={(e) => setSettings({ themeAccent: e.target.value })}
            className="rounded-lg border border-[var(--color-ink)] bg-white px-2 py-1"
          >
            <option value="coral">coral</option>
            <option value="mint">mint</option>
            <option value="sky">sky</option>
            <option value="lilac">lilac</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-butter)] px-3 py-2"
            onClick={() => setExportValue(exportSave())}
          >
            export save
          </button>
          <button
            className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-mint)] px-3 py-2"
            onClick={() => setImportOpen(true)}
          >
            import save
          </button>
          <button
            className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-coral)] px-3 py-2 text-[var(--color-ink)]"
            onClick={() => setConfirmReset(true)}
          >
            hard reset
          </button>
        </div>
        {exportValue !== null && (
          <textarea
            readOnly
            value={exportValue}
            className="h-32 w-full rounded-lg border border-[var(--color-ink)] bg-white p-2 font-mono text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
        )}
        {importOpen && (
          <div className="space-y-2">
            <textarea
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              placeholder="paste your save JSON here"
              className="h-32 w-full rounded-lg border border-[var(--color-ink)] bg-white p-2 font-mono text-xs"
            />
            <button
              className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-mint)] px-3 py-1"
              onClick={() => {
                if (importSave(importValue)) {
                  setImportOpen(false)
                  setImportValue('')
                  onClose()
                } else {
                  alert('couldn’t parse that save.')
                }
              }}
            >
              load it
            </button>
          </div>
        )}
        {confirmReset && (
          <div className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-pink)] p-3">
            this wipes everything. are you sure?
            <div className="mt-2 flex gap-2">
              <button
                className="rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1"
                onClick={() => setConfirmReset(false)}
              >
                no
              </button>
              <button
                className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-coral)] px-3 py-1"
                onClick={() => {
                  hardReset()
                  setConfirmReset(false)
                  onClose()
                }}
              >
                yes, wipe save
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

const Toggle = ({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center justify-between">
    <span>{label}</span>
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`h-6 w-11 rounded-full border border-[var(--color-ink)] transition-colors ${on ? 'bg-[var(--color-mint)]' : 'bg-white'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full border border-[var(--color-ink)] bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  </label>
)
