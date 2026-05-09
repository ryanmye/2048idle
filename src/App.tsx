import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { DevHud } from './components/DevHud'
import { ErrorBoundary } from './components/ErrorBoundary'
import { HelpModal } from './components/HelpModal'
import { Modal } from './components/Modal'
import { Money } from './components/Money'
import { Onboarding } from './components/Onboarding'
import { PrestigeConfirmModal } from './components/PrestigeConfirmModal'
import { RequireLate, RequireMid } from './components/RequireNavUnlock'
import { SettingsModal } from './components/SettingsModal'
import { Toaster } from './components/Toaster'
import { canAccessLate, canAccessMid } from './game/navigationUnlock'
import { useGameLoop } from './hooks/useGameLoop'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { useToastAudio } from './hooks/useToastAudio'
import { BoardDetailScreen } from './screens/BoardDetailScreen'
import { BotDetailScreen } from './screens/BotDetailScreen'
import { EarlyScreen } from './screens/EarlyScreen'
import { FarmDetailScreen } from './screens/FarmDetailScreen'
import { LateScreen } from './screens/LateScreen'
import { MidScreen } from './screens/MidScreen'
import { ResearchScreen } from './screens/ResearchScreen'
import { ShopScreen } from './screens/ShopScreen'
import { StatsScreen } from './screens/StatsScreen'
import { useGameStore } from './store/useGameStore'

const pillBase =
  'rounded-full border border-[var(--color-ink)] px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:outline-none inline-flex items-center gap-1'

export default function App() {
  useGameLoop()
  useToastAudio()
  const [helpOpen, setHelpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [prestigeOpen, setPrestigeOpen] = useState(false)
  const offlineSummary = useGameStore((s) => s.offlineSummary)
  const dismissOffline = useGameStore((s) => s.dismissOffline)
  const autorestartsCurrent = useGameStore((s) => s.autorestarts.current)
  useGlobalShortcuts(() => setHelpOpen((v) => !v))

  return (
    <ErrorBoundary>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <header className="mb-4 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-ink)] pb-3">
            <h1 className="font-serif text-4xl font-semibold tracking-tight">Idle 2048</h1>
            <Money />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-1 flex-wrap items-center gap-2">
              <AppNavigationInner setHelpOpen={setHelpOpen} setSettingsOpen={setSettingsOpen} setPrestigeOpen={setPrestigeOpen} />
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<EarlyScreen />} />
          <Route
            path="/mid"
            element={
              <RequireMid>
                <MidScreen />
              </RequireMid>
            }
          />
          <Route
            path="/late"
            element={
              <RequireLate>
                <LateScreen />
              </RequireLate>
            }
          />
          <Route
            path="/late/farm/:farmId"
            element={
              <RequireLate>
                <FarmDetailScreen />
              </RequireLate>
            }
          />
          <Route path="/bot" element={<BotDetailScreen />} />
          <Route path="/bot/:id" element={<BotDetailScreen />} />
          <Route path="/board/:id" element={<BoardDetailScreen />} />
          <Route path="/shop" element={<ShopScreen />} />
          <Route path="/research" element={<ResearchScreen />} />
          <Route path="/stats" element={<StatsScreen />} />
        </Routes>

        <Toaster />
        <DevHud />
        <Onboarding />

        <Modal
          open={!!offlineSummary}
          onClose={dismissOffline}
          title="welcome back"
          size="sm"
          closeLabel="collect"
        >
          {offlineSummary && (
            <>
              <p className="mt-2 text-sm">offline earnings: +{offlineSummary.points.toLocaleString()} pts</p>
              <p className="text-sm">
                used {offlineSummary.usedAutorestarts} autorestarts · {autorestartsCurrent} left
              </p>
              <p className="text-xs text-[var(--color-ink-soft)]">
                away ~{Math.round(offlineSummary.elapsedSec / 60)} minutes
              </p>
              <button
                type="button"
                onClick={dismissOffline}
                className="mt-3 rounded-lg border border-[var(--color-ink)] bg-[var(--color-mint)] px-4 py-2 text-sm"
              >
                collect
              </button>
            </>
          )}
        </Modal>

        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <PrestigeConfirmModal open={prestigeOpen} onClose={() => setPrestigeOpen(false)} />
      </main>
    </ErrorBoundary>
  )
}

type NavProps = {
  setHelpOpen: (v: boolean | ((b: boolean) => boolean)) => void
  setSettingsOpen: (v: boolean | ((b: boolean) => boolean)) => void
  setPrestigeOpen: (v: boolean | ((b: boolean) => boolean)) => void
}

function AppNavigationInner({ setHelpOpen, setSettingsOpen, setPrestigeOpen }: NavProps) {
  const boardSlots = useGameStore((s) => s.boardSlots)
  const lifetime = useGameStore((s) => s.lifetime)
  const devBypass =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev')
  const midOk = devBypass || canAccessMid({ boardSlots })
  const lateOk = devBypass || canAccessLate({ lifetime })

  const activeNav =
    'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)]'
  const idleNav = 'bg-white hover:bg-[var(--color-paper2)]'

  return (
    <>
      <NavLink
        to="/"
        end
        className={({ isActive }) => `${pillBase} ${isActive ? activeNav : idleNav}`}
      >
        board
      </NavLink>
      {midOk ? (
        <NavLink to="/mid" className={({ isActive }) => `${pillBase} ${isActive ? activeNav : idleNav}`}>
          mid
        </NavLink>
      ) : (
        <span
          className={`${pillBase} cursor-not-allowed bg-[var(--color-paper2)] opacity-70`}
          title="Buy board capacity in the shop until you have at least 2 slots"
          aria-disabled="true"
        >
          mid 🔒
        </span>
      )}
      {lateOk ? (
        <NavLink to="/late" className={({ isActive }) => `${pillBase} ${isActive ? activeNav : idleNav}`}>
          late
        </NavLink>
      ) : (
        <span
          className={`${pillBase} cursor-not-allowed bg-[var(--color-paper2)] opacity-70`}
          title="Unlock after 2 lifetime prestiges"
          aria-disabled="true"
        >
          late 🔒
        </span>
      )}
      <NavLink to="/shop" className={({ isActive }) => `${pillBase} ${isActive ? activeNav : idleNav}`}>
        shop
      </NavLink>
      <NavLink to="/bot" className={({ isActive }) => `${pillBase} ${isActive ? activeNav : idleNav}`}>
        bots
      </NavLink>
      <NavLink to="/stats" className={({ isActive }) => `${pillBase} ${isActive ? activeNav : idleNav}`}>
        stats
      </NavLink>
      <NavLink
        to="/research"
        className={({ isActive }) => `${pillBase} ${isActive ? activeNav : idleNav}`}
      >
        research
      </NavLink>

      <div className="ml-auto flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="open help"
          className="rounded-full border border-[var(--color-ink)] bg-white px-3 py-1 text-sm hover:bg-[var(--color-paper2)]"
        >
          ?
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="open settings"
          className="rounded-full border border-[var(--color-ink)] bg-white px-3 py-1 text-sm hover:bg-[var(--color-paper2)]"
        >
          ⚙
        </button>
        <button
          type="button"
          onClick={() => setPrestigeOpen(true)}
          className="rounded-full border-2 border-[var(--color-ink)] bg-[var(--color-coral)] px-3 py-1 text-sm font-semibold text-[var(--color-ink)] hover:brightness-105"
        >
          prestige…
        </button>
      </div>
    </>
  )
}
