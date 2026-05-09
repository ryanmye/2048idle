import type { Bot } from './types'

/** Assign serials to legacy bots (stable uid order); merge hint keeps prestige/import continuity. */
export function ensureBotsSerialFields(
  bots: Bot[],
  nextBotSerialHint?: number,
): { bots: Bot[]; nextBotSerial: number } {
  const withNick = bots.map((b) => ({
    ...b,
    nickname: b.nickname ?? null,
  }))
  let maxS = -1
  for (const b of withNick) {
    if (typeof b.serial === 'number' && !Number.isNaN(b.serial)) maxS = Math.max(maxS, b.serial)
  }
  let assign = maxS + 1
  const missing = withNick
    .filter((b) => typeof b.serial !== 'number' || Number.isNaN(b.serial))
    .sort((a, b) => a.uid.localeCompare(b.uid))
  const map = new Map<string, number>()
  for (const b of missing) {
    map.set(b.uid, assign++)
  }
  const out: Bot[] = withNick.map((b) =>
    typeof b.serial === 'number' && !Number.isNaN(b.serial)
      ? (b as Bot)
      : { ...(b as Bot), serial: map.get(b.uid)! },
  )
  const maxAfter = out.reduce((m, b) => Math.max(m, b.serial), -1)
  const derivedNext = maxAfter + 1
  const hint =
    typeof nextBotSerialHint === 'number' && !Number.isNaN(nextBotSerialHint)
      ? nextBotSerialHint
      : derivedNext
  return { bots: out, nextBotSerial: Math.max(derivedNext, hint) }
}
