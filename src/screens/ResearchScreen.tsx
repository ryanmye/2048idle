import { useMemo, useState } from 'react'
import { RESEARCH_NODES, findResearchNode } from '../game/research'
import { useGameStore } from '../store/useGameStore'
import { BALANCE } from '../data/balance'

const ringRadius: Record<number, number> = { 1: 80, 2: 145, 3: 200, 4: 250 }

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

export function ResearchScreen() {
  const prestigeLevel = useGameStore((s) => s.prestigeLevel)
  const tokens = useGameStore((s) => s.prestigeTokens)
  const owned = useGameStore((s) => s.research.ownedNodes)
  const open = useGameStore((s) => s.research.open)
  const unlock = useGameStore((s) => s.unlockResearchNode)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const visibleRing = prestigeLevel >= 16 ? 4 : prestigeLevel >= 3 ? 3 : prestigeLevel >= 2 ? 2 : prestigeLevel >= 1 ? 1 : 0

  const nodes = useMemo(() => RESEARCH_NODES.filter((n) => n.ring <= visibleRing), [visibleRing])
  const center = { x: 320, y: 230 }
  const hoverNode = hoverId ? findResearchNode(hoverId) : null

  if (!open && prestigeLevel === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-6 shadow-[0_4px_0_var(--color-ink)]">
        <h2 className="font-serif text-2xl">research is sealed</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          accumulate {BALANCE.prestige.minimumTotalPts.toLocaleString()} lifetime pts and prestige once to crack the core open. nodes unlock per ring as your prestige level rises.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <section className="rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-3 shadow-[0_4px_0_var(--color-ink)]">
        <svg viewBox="0 0 640 460" className="w-full">
          {[1, 2, 3, 4].map((ring) => (
            <circle
              key={`ring-${ring}`}
              cx={center.x}
              cy={center.y}
              r={ringRadius[ring]}
              fill="none"
              stroke="var(--color-ink-soft)"
              strokeOpacity={ring <= visibleRing ? 0.4 : 0.15}
              strokeDasharray={ring <= visibleRing ? '0' : '3 6'}
            />
          ))}
          <circle cx={center.x} cy={center.y} r={26} fill="var(--color-paper2)" stroke="var(--color-ink)" />
          <text x={center.x} y={center.y + 4} textAnchor="middle" fontSize="11">core</text>
          {nodes
            .filter((n) => n.parentId)
            .map((n) => {
              const parent = findResearchNode(n.parentId!)
              if (!parent) return null
              const a = polar(center.x, center.y, ringRadius[parent.ring], parent.angle)
              const b = polar(center.x, center.y, ringRadius[n.ring], n.angle)
              return (
                <line
                  key={`edge-${n.id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--color-ink)"
                  strokeOpacity={0.55}
                />
              )
            })}
          {nodes.map((n) => {
            const p = polar(center.x, center.y, ringRadius[n.ring], n.angle)
            const isOwned = owned.includes(n.id)
            const parentSatisfied = !n.parentId || owned.includes(n.parentId)
            const available = n.requiresPrestige <= prestigeLevel && parentSatisfied && !isOwned && tokens >= BALANCE.research.nodeCost
            const fill = isOwned ? n.color ?? 'var(--color-mint)' : 'var(--color-paper)'
            return (
              <g
                key={n.id}
                onClick={() => available && unlock(n.id)}
                onMouseEnter={() => setHoverId(n.id)}
                onMouseLeave={() => setHoverId((id) => (id === n.id ? null : id))}
                className={available ? 'cursor-pointer' : 'cursor-default'}
              >
                {!n.parentId && <line x1={center.x} y1={center.y} x2={p.x} y2={p.y} stroke="var(--color-ink)" opacity={0.7} />}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={22}
                  fill={fill}
                  stroke="var(--color-ink)"
                  strokeWidth={isOwned ? 2.5 : 1.5}
                  strokeDasharray={available || isOwned ? undefined : '3 3'}
                  opacity={n.requiresPrestige <= prestigeLevel ? 1 : 0.45}
                />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="10">{n.label}</text>
              </g>
            )
          })}
          {hoverNode && (
            <g pointerEvents="none">
              <rect
                x={center.x - 110}
                y={420}
                width={220}
                height={36}
                rx={8}
                fill="var(--color-paper2)"
                stroke="var(--color-ink)"
              />
              <text x={center.x} y={440} textAnchor="middle" fontSize="11" fontWeight="bold">
                {hoverNode.label}
              </text>
              <text x={center.x} y={452} textAnchor="middle" fontSize="9">
                {hoverNode.description}
              </text>
            </g>
          )}
        </svg>
      </section>
      <aside className="space-y-3 rounded-2xl border border-[var(--color-ink)] bg-[var(--color-paper)] p-4 shadow-[0_4px_0_var(--color-ink)]">
        <h3 className="font-serif text-xl">prestige + research</h3>
        <p className="text-sm">prestige level: {prestigeLevel}</p>
        <p className="text-sm">tokens: {tokens} ◆</p>
        <p className="text-sm text-[var(--color-ink-soft)]">
          ring {visibleRing}/4 visible · 1 ◆ per node
        </p>
        {hoverNode ? (
          <div className="rounded-xl border border-[var(--color-ink)] bg-[var(--color-paper2)] p-3 text-sm">
            <p className="font-serif text-base">{hoverNode.label}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">{hoverNode.description}</p>
            <p className="mt-1 text-xs">requires prestige {hoverNode.requiresPrestige}</p>
            {hoverNode.parentId && <p className="text-xs">parent: {hoverNode.parentId}</p>}
          </div>
        ) : (
          <p className="text-xs text-[var(--color-ink-soft)]">hover a node for details</p>
        )}
        <p className="text-sm text-[var(--color-ink-soft)]">far-future branch: 5×5(P7) → 6×6(P9) → 7×7(P12) → 8×8(P16) → 9×9(P20)</p>
      </aside>
    </div>
  )
}
