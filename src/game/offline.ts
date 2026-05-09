import { BALANCE } from '../data/balance'
import type { OfflineSummary } from './types'

export const calculateOffline = (
  onlinePps: number,
  elapsedMs: number,
  autorestarts: number,
  boardCount: number,
  offlineRateBonusPct = 0,
): OfflineSummary => {
  const elapsedSec = Math.min(elapsedMs / 1000, BALANCE.offline.maxSeconds)
  const baseRate = BALANCE.offline.baseRate * (1 + offlineRateBonusPct / 100)
  const basePts = onlinePps * baseRate * elapsedSec
  const used = Math.min(
    autorestarts,
    Math.floor((elapsedSec / BALANCE.offline.baseFillSeconds) * Math.max(1, boardCount)),
  )
  const throttle =
    boardCount > 0 ? Math.max(0.25, 1 - used / Math.max(1, autorestarts + used)) : 1
  return {
    points: Math.floor(basePts * throttle),
    usedAutorestarts: used,
    elapsedSec,
  }
}
