import { describe, expect, it } from 'vitest'
import { BALANCE } from '../data/balance'
import type { LifetimeStats } from './types'
import { canAccessLate, canAccessMid } from './navigationUnlock'

function life(prestiges: number): LifetimeStats {
  return {
    totalPts: 0,
    totalMoves: 0,
    totalMerges: 0,
    bestTile: 0,
    prestiges,
    rageTriggers: 0,
    playTime: 0,
    boardsFinished: 0,
  }
}

describe('navigationUnlock', () => {
  it('mid requires configured minimum board slots', () => {
    expect(canAccessMid({ boardSlots: BALANCE.navigation.midMinBoardSlots - 1 })).toBe(false)
    expect(canAccessMid({ boardSlots: BALANCE.navigation.midMinBoardSlots })).toBe(true)
  })

  it('late requires configured lifetime prestiges', () => {
    expect(canAccessLate({ lifetime: life(BALANCE.navigation.lateMinPrestiges - 1) })).toBe(false)
    expect(canAccessLate({ lifetime: life(BALANCE.navigation.lateMinPrestiges) })).toBe(true)
  })
})
