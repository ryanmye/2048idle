let ctx: AudioContext | null = null

const ensureCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return ctx
}

const tone = (
  freq: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  gain = 0.05,
) => {
  const ac = ensureCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, ac.currentTime)
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.005)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + durationMs / 1000)
  osc.connect(g).connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + durationMs / 1000 + 0.05)
}

export const sounds = {
  merge: (enabled: boolean) => {
    if (!enabled) return
    tone(520, 90, 'triangle', 0.04)
  },
  achievement: (enabled: boolean) => {
    if (!enabled) return
    tone(660, 140, 'sine', 0.05)
    setTimeout(() => tone(880, 140, 'sine', 0.04), 70)
  },
  prestige: (enabled: boolean) => {
    if (!enabled) return
    tone(880, 200, 'sine', 0.05)
    setTimeout(() => tone(1320, 250, 'sine', 0.04), 90)
  },
}
