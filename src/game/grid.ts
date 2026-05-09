import { random, uid } from '../utils/rng'
import type { Direction, GridSize, Tile } from './types'

export const tilesToGrid = (tiles: Tile[], size: number): number[][] => {
  const grid: number[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => 0))
  for (const t of tiles) grid[t.row][t.col] = t.value
  return grid
}

export const gridToTiles = (grid: number[][]): Tile[] => {
  const out: Tile[] = []
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r].length; c += 1) {
      const v = grid[r][c]
      if (v !== 0) out.push({ id: uid('t'), value: v, row: r, col: c })
    }
  }
  return out
}

export const createEmpty = (size: GridSize): Tile[] => {
  void size
  return []
}

export const emptyCells = (tiles: Tile[], size: number): Array<{ r: number; c: number }> => {
  const occupied = new Set<string>()
  for (const t of tiles) occupied.add(`${t.row},${t.col}`)
  const cells: Array<{ r: number; c: number }> = []
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (!occupied.has(`${r},${c}`)) cells.push({ r, c })
    }
  }
  return cells
}

export const spawnTile = (tiles: Tile[], size: number, luckyChance = 0): Tile[] => {
  const empties = emptyCells(tiles, size)
  if (!empties.length) return tiles
  const pick = empties[Math.floor(random() * empties.length)]
  const fourChance = 0.1 + luckyChance
  const value = random() < fourChance ? 4 : 2
  return [...tiles, { id: uid('t'), value, row: pick.r, col: pick.c, fresh: true }]
}

const clearTransientTileFlags = (tiles: Tile[]): Tile[] =>
  tiles.map((t) => (t.fresh || t.merged ? { ...t, fresh: false, merged: false } : t))

const moveLine = (
  line: Tile[],
  size: number,
  axis: 'row' | 'col',
  forward: boolean,
): { tiles: Tile[]; gained: number; merges: number; moved: boolean } => {
  const sorted = [...line].sort((a, b) => {
    const ax = axis === 'row' ? a.col : a.row
    const bx = axis === 'row' ? b.col : b.row
    return forward ? ax - bx : bx - ax
  })
  const positions: Tile[] = []
  let gained = 0
  let merges = 0
  let moved = false
  let cursor = forward ? 0 : size - 1
  const step = forward ? 1 : -1

  for (let i = 0; i < sorted.length; i += 1) {
    const t = sorted[i]
    const next = sorted[i + 1]
    if (next && next.value === t.value) {
      const value = t.value * 2
      const placedRow = axis === 'row' ? t.row : cursor
      const placedCol = axis === 'row' ? cursor : t.col
      positions.push({ id: uid('t'), value, row: placedRow, col: placedCol, merged: true })
      gained += value
      merges += 1
      const originRow = axis === 'row' ? t.row : t.row
      const originCol = axis === 'row' ? t.col : t.col
      if (originRow !== placedRow || originCol !== placedCol) moved = true
      const next2Row = axis === 'row' ? next.row : next.row
      const next2Col = axis === 'row' ? next.col : next.col
      if (next2Row !== placedRow || next2Col !== placedCol) moved = true
      i += 1
      cursor += step
      continue
    }
    const placedRow = axis === 'row' ? t.row : cursor
    const placedCol = axis === 'row' ? cursor : t.col
    if (placedRow !== t.row || placedCol !== t.col) moved = true
    positions.push({ ...t, row: placedRow, col: placedCol, fresh: false, merged: false })
    cursor += step
  }
  return { tiles: positions, gained, merges, moved }
}

export const move = (
  tiles: Tile[],
  size: number,
  direction: Direction,
): { tiles: Tile[]; gained: number; merged: number; moved: boolean } => {
  const isHorizontal = direction === 'left' || direction === 'right'
  const forward = direction === 'left' || direction === 'up'

  const lines: Tile[][] = Array.from({ length: size }, () => [])
  for (const t of tiles) {
    const idx = isHorizontal ? t.row : t.col
    lines[idx].push(t)
  }

  const out: Tile[] = []
  let gained = 0
  let merges = 0
  let moved = false
  for (const line of lines) {
    const result = moveLine(line, size, isHorizontal ? 'row' : 'col', forward)
    out.push(...result.tiles)
    gained += result.gained
    merges += result.merges
    if (result.moved) moved = true
  }

  if (!moved) {
    return { tiles: clearTransientTileFlags(tiles), gained: 0, merged: 0, moved: false }
  }

  return { tiles: out, gained, merged: merges, moved }
}

export const hasMoves = (tiles: Tile[], size: number): boolean => {
  if (emptyCells(tiles, size).length > 0) return true
  const grid = tilesToGrid(tiles, size)
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const v = grid[r][c]
      if (r + 1 < size && grid[r + 1][c] === v) return true
      if (c + 1 < size && grid[r][c + 1] === v) return true
    }
  }
  return false
}

export const maxTile = (tiles: Tile[]): number =>
  tiles.reduce((acc, t) => Math.max(acc, t.value), 0)
