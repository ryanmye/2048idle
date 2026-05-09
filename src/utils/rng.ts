let seed: number | null = null
let state = 0

export const setSeed = (next: number | null) => {
  seed = next
  state = next ?? 0
}

export const random = (): number => {
  if (seed === null) return Math.random()
  state = (state * 1664525 + 1013904223) >>> 0
  return state / 0x100000000
}

export const randomInt = (max: number): number => Math.floor(random() * max)

export const randomItem = <T>(items: readonly T[]): T => items[randomInt(items.length)]

let nextId = 0
export const uid = (prefix = 'id'): string => {
  nextId += 1
  return `${prefix}-${nextId.toString(36)}-${Math.floor(random() * 0xffffff).toString(36)}`
}
