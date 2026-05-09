import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BotRenameInline } from '../components/BotRenameInline'
import { Money } from '../components/Money'
import { BOTS } from '../data/bots'
import { BALANCE } from '../data/balance'
import { BOT_UPGRADE_DEFS } from '../data/botUpgrades'
import { botTitleLine } from '../game/botLabel'
import { useGameStore, upgradeCostFor, upgradeMaxLevelFor } from '../store/useGameStore'

export function BotDetailScreen() {
  const params = useParams<{ id?: string }>()
  const bots = useGameStore((s) => s.bots)
  const points = useGameStore((s) => s.points)
  const buyUpgrade = useGameStore((s) => s.buyUpgrade)
  const sellBot = useGameStore((s) => s.sellBot)
  const fuseBots = useGameStore((s) => s.fuseBots)
  const fusionUnlocked = useGameStore((s) => s.fusionUnlocked)
  const setBotEnabled = useGameStore((s) => s.setBotEnabled)
  const navigate = useNavigate()

  const idx = useMemo(() => {
    if (!params.id) return 0
    const i = bots.findIndex((b) => b.uid === params.id)
    return i < 0 ? 0 : i
  }, [params.id, bots])
  const bot = bots[idx]
  const cat = useMemo(() => (bot ? BOTS.find((b) => b.id === bot.type) : null), [bot])

  const sameType = bot ? bots.filter((b) => b.type === bot.type) : []
  const fusionReady = fusionUnlocked && bot
    ? bots.filter((b) => b.type === bot.type && !b.boardId).length >= BALANCE.fusion.unitsRequired
    : false

  if (!bot || !cat) {
    return (
      <div className="rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-6 text-sm text-[var(--color-ink-soft)] shadow-[0_4px_0_var(--color-ink)]">
        no bots yet — head over to the shop to buy one.
        <button onClick={() => navigate('/shop')} className="ml-3 rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1 text-sm">
          shop →
        </button>
      </div>
    )
  }

  const goPrev = () => {
    if (bots.length <= 1) return
    const next = bots[(idx - 1 + bots.length) % bots.length]
    navigate(`/bot/${next.uid}`)
  }
  const goNext = () => {
    if (bots.length <= 1) return
    const next = bots[(idx + 1) % bots.length]
    navigate(`/bot/${next.uid}`)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <section className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-lilac)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <div className="flex items-center justify-between">
          <button onClick={goPrev} className="rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1 text-sm">‹ prev</button>
          <span className="text-xs uppercase">{idx + 1}/{bots.length}</span>
          <button onClick={goNext} className="rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1 text-sm">next ›</button>
        </div>
        <p className="text-xs uppercase tracking-wide">{cat.rarity} · TIER {cat.tier}</p>
        <div className="grid aspect-square place-items-center rounded-xl border border-dashed border-[var(--color-ink)] bg-white font-mono text-2xl">
          {cat.id}
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <h2 className="font-serif text-2xl">{botTitleLine(bot, cat)}</h2>
          <BotRenameInline botUid={bot.uid} catalogName={cat.name} />
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">{cat.algo}</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Stat label="moves" value={bot.lifetime.moves.toLocaleString()} />
          <Stat label="merges" value={bot.lifetime.merges.toLocaleString()} />
          <Stat label="restarts" value={bot.lifetime.restartsUsed.toLocaleString()} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-ink)] bg-white px-3 py-2 text-sm">
          <span className="text-[var(--color-ink-soft)]">Simulation</span>
          <button
            type="button"
            role="switch"
            aria-checked={bot.enabled}
            onClick={() => setBotEnabled(bot.uid, !bot.enabled)}
            className={`rounded-full border-2 border-[var(--color-ink)] px-3 py-1 text-xs font-semibold ${
              bot.enabled ? 'bg-[var(--color-mint)]' : 'bg-[var(--color-paper2)] text-[var(--color-ink-soft)]'
            }`}
          >
            {bot.enabled ? 'on — plays boards' : 'off — paused'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => sellBot(bot.uid)}
            className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-coral)] px-3 py-1 text-sm text-[var(--color-ink)]"
          >
            sell · +{Math.floor((cat.cost ?? 0) * BALANCE.sell.refundPct).toLocaleString()} pts
          </button>
          <button
            disabled={!fusionReady}
            onClick={() => fuseBots(bot.type)}
            className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-mint)] px-3 py-1 text-sm disabled:opacity-50"
          >
            {fusionUnlocked ? `fuse 3 → 1` : 'fusion locked'}
          </button>
        </div>
      </section>
      <section className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl">upgrades</h3>
          <Money />
        </div>
        {BOT_UPGRADE_DEFS.map((u) => {
          const level = bot.upgrades[u.kind]
          const max = upgradeMaxLevelFor(u.kind)
          const cost = upgradeCostFor(u.kind, level, cat.cost ?? 0)
          const canBuy = level < max && points >= cost
          return (
            <div key={u.kind} className="rounded-xl border border-[var(--color-ink)] bg-white p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{u.label}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{u.effect}</p>
                </div>
                <p className="font-mono text-xs">lvl {level}/{max}</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded bg-[var(--color-paper2)]">
                <div
                  className="h-full bg-[var(--color-mint)] transition-all"
                  style={{ width: `${Math.min(100, (level / max) * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-mono">{cost.toLocaleString()} pts</span>
                <button
                  disabled={!canBuy}
                  onClick={() => buyUpgrade(bot.uid, u.kind)}
                  className="rounded-lg border border-[var(--color-ink)] bg-white px-3 py-1 text-xs hover:bg-[var(--color-paper2)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {level >= max ? 'maxed' : '+1'}
                </button>
              </div>
            </div>
          )
        })}
        <p className="text-xs text-[var(--color-ink-soft)]">{sameType.length} of this type owned</p>
      </section>
    </div>
  )
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-[var(--color-ink)] bg-white p-2">
    <p className="text-[10px] uppercase text-[var(--color-ink-soft)]">{label}</p>
    <p className="font-mono">{value}</p>
  </div>
)
