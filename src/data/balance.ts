export const BALANCE = {
  schemaVersion: 3,
  mergeBoardSizeMultiplierBase: 2,
  mergeBonusPerLevelPct: 0.02,
  autorestarts: {
    startingCap: 100,
    regenSeconds: 240,
    refill: [
      { amount: 10, cost: 200 },
      { amount: 50, cost: 900 },
      { amount: 100, cost: 3000 },
    ],
    permanentCaps: [
      { to: 125, cost: 8000 },
      { to: 150, cost: 32000 },
      { to: 200, cost: 180000 },
    ],
  },
  boardSlots: {
    start: 1,
    costs: [2000, 6000, 18000, 36000, 80000, 160000],
  },
  upgrades: {
    speedMultiplierPerLevel: 1.15,
    speedCostBaseMult: 0.4,
    speedCostGrowth: 1.6,
    speedMaxLevel: 25,
    depthCostBaseMult: 1,
    depthCostGrowth: 2,
    depthMaxLevel: 6,
    mergeBonusCostStep: 200,
    mergeBonusMaxLevel: 20,
    luckyCostStep: 1500,
    luckyMaxLevel: 5,
  },
  offline: {
    baseRate: 0.35,
    maxSeconds: 8 * 60 * 60,
    baseFillSeconds: 300,
  },
  prestige: {
    minimumTotalPts: 1_000_000,
    formulaLogOffset: 5,
  },
  rage: {
    movesToFill: 50,
    speedMultiplier: 3,
    baseDurationSeconds: 30,
  },
  bot: {
    renameCostPts: 500,
  },
  fusion: {
    unitsRequired: 3,
  },
  sell: {
    refundPct: 0.5,
  },
  history: {
    sampleIntervalMs: 1000,
    bufferLength: 60,
  },
  noManualHoursForAchievement: 24,
  research: {
    nodeCost: 1,
  },
  /** Era nav: Mid after first capacity tier; Late after N lifetime prestiges. */
  navigation: {
    midMinBoardSlots: 2,
    lateMinPrestiges: 2,
  },
} as const
