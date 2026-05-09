import { random } from '../../utils/rng'
import { hasMoves, move, tilesToGrid, emptyCells } from '../grid'
import type { BotType, Direction, Tile } from '../types'

const ALL_DIRS: Direction[] = ['left', 'up', 'right', 'down']

const countEmpty = (g: number[][]): number => {
  let c = 0
  for (let r = 0; r < g.length; r += 1) for (let cc = 0; cc < g.length; cc += 1) if (g[r][cc] === 0) c += 1
  return c
}

const monotonicity = (g: number[][]): number => {
  const totals = [0, 0, 0, 0]
  const n = g.length
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n - 1; c += 1) {
      const a = g[r][c] ? Math.log2(g[r][c]) : 0
      const b = g[r][c + 1] ? Math.log2(g[r][c + 1]) : 0
      if (a > b) totals[0] += b - a
      else totals[1] += a - b
    }
  }
  for (let c = 0; c < n; c += 1) {
    for (let r = 0; r < n - 1; r += 1) {
      const a = g[r][c] ? Math.log2(g[r][c]) : 0
      const b = g[r + 1][c] ? Math.log2(g[r + 1][c]) : 0
      if (a > b) totals[2] += b - a
      else totals[3] += a - b
    }
  }
  return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3])
}

const smoothness = (g: number[][]): number => {
  let s = 0
  const n = g.length
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const v = g[r][c]
      if (!v) continue
      const lv = Math.log2(v)
      if (c + 1 < n && g[r][c + 1]) s -= Math.abs(lv - Math.log2(g[r][c + 1]))
      if (r + 1 < n && g[r + 1][c]) s -= Math.abs(lv - Math.log2(g[r + 1][c]))
    }
  }
  return s
}

const cornerScore = (g: number[][]): number => {
  let max = 0
  let mr = 0
  let mc = 0
  for (let r = 0; r < g.length; r += 1) {
    for (let c = 0; c < g.length; c += 1) {
      if (g[r][c] > max) {
        max = g[r][c]
        mr = r
        mc = c
      }
    }
  }
  if (mr === 0 && mc === 0) return Math.log2(Math.max(2, max)) * 2
  if ((mr === 0 || mr === g.length - 1) && (mc === 0 || mc === g.length - 1)) return Math.log2(Math.max(2, max))
  return 0
}

const heuristic = (g: number[][]): number =>
  countEmpty(g) * 2 + monotonicity(g) + smoothness(g) * 0.1 + cornerScore(g) * 1.5

const tryDirections = (
  tiles: Tile[],
  size: number,
  dirs: readonly Direction[],
): Direction | null => {
  for (const dir of dirs) {
    const r = move(tiles, size, dir)
    if (r.moved) return dir
  }
  return null
}

const randomLegalDir = (tiles: Tile[], size: number): Direction | null => {
  const dirs = [...ALL_DIRS].sort(() => random() - 0.5)
  return tryDirections(tiles, size, dirs)
}

const cornerAnchor: Strategy = (tiles, size) => tryDirections(tiles, size, ['left', 'up', 'right', 'down'])

const snake: Strategy = (tiles, size) => {
  const g = tilesToGrid(tiles, size)
  const lastRow = g[size - 1]
  const fillingRight = lastRow.some((v, i) => v !== 0 && i < size - 1) || lastRow.every((v) => v !== 0)
  const order: Direction[] = fillingRight ? ['right', 'down', 'left', 'up'] : ['left', 'down', 'right', 'up']
  return tryDirections(tiles, size, order)
}

const greedy: Strategy = (tiles, size) => {
  let best: Direction | null = null
  let bestScore = -Infinity
  for (const dir of ALL_DIRS) {
    const r = move(tiles, size, dir)
    if (!r.moved) continue
    const score = r.gained * 2 + heuristic(tilesToGrid(r.tiles, size))
    if (score > bestScore) {
      bestScore = score
      best = dir
    }
  }
  return best
}

const minimax = (tiles: Tile[], size: number, depth: number): { dir: Direction | null; score: number } => {
  if (depth === 0) return { dir: null, score: heuristic(tilesToGrid(tiles, size)) }
  let best: Direction | null = null
  let bestScore = -Infinity
  for (const dir of ALL_DIRS) {
    const r = move(tiles, size, dir)
    if (!r.moved) continue
    const sub = minimax(r.tiles, size, depth - 1)
    const score = r.gained + sub.score
    if (score > bestScore) {
      bestScore = score
      best = dir
    }
  }
  return { dir: best, score: bestScore === -Infinity ? heuristic(tilesToGrid(tiles, size)) : bestScore }
}

const expectimax = (tiles: Tile[], size: number, depth: number, isMax: boolean): number => {
  if (depth === 0 || !hasMoves(tiles, size)) return heuristic(tilesToGrid(tiles, size))
  if (isMax) {
    let best = -Infinity
    for (const dir of ALL_DIRS) {
      const r = move(tiles, size, dir)
      if (!r.moved) continue
      const score = r.gained + expectimax(r.tiles, size, depth - 1, false)
      if (score > best) best = score
    }
    return best === -Infinity ? heuristic(tilesToGrid(tiles, size)) : best
  }
  const empties = emptyCells(tiles, size)
  if (!empties.length) return heuristic(tilesToGrid(tiles, size))
  const sample = empties.slice(0, Math.min(empties.length, 4))
  let total = 0
  for (const cell of sample) {
    const next2: Tile[] = [...tiles, { id: 'sim', value: 2, row: cell.r, col: cell.c }]
    const next4: Tile[] = [...tiles, { id: 'sim', value: 4, row: cell.r, col: cell.c }]
    total += 0.9 * expectimax(next2, size, depth - 1, true)
    total += 0.1 * expectimax(next4, size, depth - 1, true)
  }
  return total / sample.length
}

const pickByLookahead = (tiles: Tile[], size: number, depth: number, useExpecti: boolean): Direction | null => {
  let best: Direction | null = null
  let bestScore = -Infinity
  for (const dir of ALL_DIRS) {
    const r = move(tiles, size, dir)
    if (!r.moved) continue
    const score = useExpecti
      ? r.gained + expectimax(r.tiles, size, depth - 1, false)
      : r.gained + minimax(r.tiles, size, depth - 1).score
    if (score > bestScore) {
      bestScore = score
      best = dir
    }
  }
  return best
}

type Strategy = (tiles: Tile[], size: number) => Direction | null

const luPriority: Strategy = (tiles, size) => tryDirections(tiles, size, ['left', 'up', 'right', 'down'])

const STRATEGIES: Record<BotType, Strategy> = {
  rand: (tiles, size) => randomLegalDir(tiles, size),
  lu: luPriority,
  corner: cornerAnchor,
  snake,
  greedy,
  minmax2: (tiles, size) => pickByLookahead(tiles, size, 2, false),
  minmax4: (tiles, size) => pickByLookahead(tiles, size, 4, false),
  expecti: (tiles, size) => pickByLookahead(tiles, size, 3, true),
  mcts: (tiles, size) => pickByLookahead(tiles, size, 3, true),
  ntuple: greedy,
  afterstate: (tiles, size) => pickByLookahead(tiles, size, 4, true),
  myth: greedy,
}

export const pickDirection = (botType: BotType, tiles: Tile[], size: number): Direction | null => {
  const strat = STRATEGIES[botType] ?? STRATEGIES.rand
  const dir = strat(tiles, size)
  if (dir) return dir
  return randomLegalDir(tiles, size)
}
