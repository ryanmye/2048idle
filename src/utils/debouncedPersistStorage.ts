import {
  createJSONStorage,
  type PersistStorage,
  type StateStorage,
  type StorageValue,
} from 'zustand/middleware'

const DEBOUNCE_MS = 800

/**
 * Default persist calls `setItem` on every state change. The idle tick updates often;
 * debounce JSON → localStorage and flush when the tab goes to background or closes.
 */
export function createDebouncedJSONStorage<S>(
  getStorage: () => StateStorage,
  debounceMs = DEBOUNCE_MS,
): PersistStorage<S> | undefined {
  const base = createJSONStorage<S>(getStorage)
  if (!base) return undefined

  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: { name: string; value: StorageValue<S> } | null = null

  const flush = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (pending) {
      base.setItem(pending.name, pending.value)
      pending = null
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush)
  }

  return {
    getItem: base.getItem,
    setItem: (name, value) => {
      pending = { name, value }
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        if (pending) {
          base.setItem(pending.name, pending.value)
          pending = null
        }
      }, debounceMs)
    },
    removeItem: (name) => {
      flush()
      return base.removeItem(name)
    },
  }
}
