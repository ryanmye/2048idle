import { useMemo } from 'react'
import { Sparkline } from '../components/Sparkline'
import { ACHIEVEMENTS } from '../data/achievements'
import { categoryColor } from '../game/achievements'
import { useGameStore } from '../store/useGameStore'

export function StatsScreen() {
  const lifetime = useGameStore((s) => s.lifetime)
  const achievements = useGameStore((s) => s.achievements)
  const botCount = useGameStore((s) => s.bots.length)
  const pointsHistory = useGameStore((s) => s.pointsHistory)

  const sorted = useMemo(() => {
    return [...ACHIEVEMENTS].sort((a, b) => {
      const aGot = achievements[a.id]?.got ? 1 : 0
      const bGot = achievements[b.id]?.got ? 1 : 0
      return aGot - bGot
    })
  }, [achievements])

  const statTiles: Array<[string, string]> = [
    ['total pts', Math.floor(lifetime.totalPts).toLocaleString()],
    ['boards finished', lifetime.boardsFinished.toLocaleString()],
    ['moves made', lifetime.totalMoves.toLocaleString()],
    ['merges', lifetime.totalMerges.toLocaleString()],
    ['best tile', lifetime.bestTile.toLocaleString()],
    ['bots owned', botCount.toString()],
    ['prestiges', lifetime.prestiges.toString()],
    ['rage triggers', lifetime.rageTriggers.toString()],
    ['play time', `${Math.floor(lifetime.playTime / 60)}m`],
  ]

  const completed = ACHIEVEMENTS.filter((a) => achievements[a.id]?.got).length

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {statTiles.map(([k, v]) => (
            <div key={k} className="rounded-xl border border-[var(--color-ink)] bg-white p-3">
              <p className="text-xs uppercase text-[var(--color-ink-soft)]">{k}</p>
              <p className="font-serif text-xl">{v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Production · last {pointsHistory.length}s</p>
          <Sparkline points={pointsHistory.length ? pointsHistory : [0, 0, 0]} />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl">achievements</h3>
          <p className="text-sm">{completed}/{ACHIEVEMENTS.length}</p>
        </div>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
          {sorted.map((a) => {
            const got = achievements[a.id]?.got
            return (
              <article
                key={a.id}
                className={`rounded-xl border border-[var(--color-ink)] p-3 transition-all ${got ? 'opacity-65' : ''}`}
                style={{ background: categoryColor(a.cat) }}
              >
                <p className="text-[10px] uppercase tracking-wide">{a.cat}</p>
                <h3 className="font-serif text-base">{a.hidden && !got ? '???' : a.label}</h3>
                <p className="text-xs">→ {a.hidden && !got ? '???' : a.reward}</p>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
