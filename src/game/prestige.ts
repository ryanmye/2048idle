import { BALANCE } from '../data/balance'

export const calculatePrestigeTokens = (totalPts: number): number => {
  if (totalPts < BALANCE.prestige.minimumTotalPts) return 0
  return Math.max(0, Math.floor(Math.log10(totalPts) - BALANCE.prestige.formulaLogOffset))
}
