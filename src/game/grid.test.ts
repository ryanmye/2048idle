import { describe, expect, it } from 'vitest'
import { createEmpty, hasMoves, move, gridToTiles, tilesToGrid } from './grid'

describe('grid', () => {
  it('creates empty tiles array', () => {
    expect(createEmpty(4)).toEqual([])
  })

  it('moves and merges left', () => {
    const tiles = gridToTiles([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])
    const result = move(tiles, 4, 'left')
    const grid = tilesToGrid(result.tiles, 4)
    expect(grid[0][0]).toBe(4)
    expect(result.gained).toBe(4)
    expect(result.merged).toBe(1)
    expect(result.moved).toBe(true)
  })

  it('reports moved=false when nothing changes', () => {
    const tiles = gridToTiles([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])
    const result = move(tiles, 4, 'left')
    expect(result.moved).toBe(false)
  })

  it('handles a 5x5 board move', () => {
    const tiles = gridToTiles([
      [0, 4, 4, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ])
    const result = move(tiles, 5, 'left')
    const grid = tilesToGrid(result.tiles, 5)
    expect(grid[0][0]).toBe(8)
    expect(result.gained).toBe(8)
  })

  it('detects no moves on full unmergeable board', () => {
    const tiles = gridToTiles([
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ])
    expect(hasMoves(tiles, 4)).toBe(false)
  })

  it('detects available moves when empty exists', () => {
    const tiles = gridToTiles([
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ])
    expect(hasMoves(tiles, 4)).toBe(true)
  })
})
