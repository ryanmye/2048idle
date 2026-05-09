import { BALANCE } from '../data/balance'
import type { GameState } from './types'

export function canAccessMid(s: Pick<GameState, 'boardSlots'>): boolean {
  return s.boardSlots >= BALANCE.navigation.midMinBoardSlots
}

export function canAccessLate(s: Pick<GameState, 'lifetime'>): boolean {
  return s.lifetime.prestiges >= BALANCE.navigation.lateMinPrestiges
}
