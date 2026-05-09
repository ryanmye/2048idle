export function Sparkline({ points }: { points: number[] }) {
  const width = 180
  const height = 36
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const spread = Math.max(1, max - min)
  const d = points
    .map((p, i) => {
      const x = (i / Math.max(1, points.length - 1)) * width
      const y = height - ((p - min) / spread) * height
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-full">
      <path d={d} fill="none" stroke="var(--color-coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
