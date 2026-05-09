import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message?: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    void info
  }

  hardReset = () => {
    try {
      localStorage.removeItem('idle2048:v2')
      localStorage.removeItem('idle2048:v1')
    } catch {
      // ignore
    }
    location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-2xl border-2 border-[var(--color-ink)] bg-[var(--color-paper)] p-6">
        <h1 className="font-serif text-3xl">Something cracked open.</h1>
        <p className="mt-3 text-sm opacity-80">{this.state.message ?? 'Unexpected error.'}</p>
        <p className="mt-2 text-sm">If this is a save corruption, try restoring from an export, or reset.</p>
        <div className="mt-4 flex gap-2">
          <button
            className="rounded-lg border border-[var(--color-ink)] bg-[var(--color-coral)] px-4 py-2 text-[var(--color-ink)]"
            onClick={() => location.reload()}
          >
            try again
          </button>
          <button
            className="rounded-lg border border-[var(--color-ink)] bg-white px-4 py-2"
            onClick={this.hardReset}
          >
            hard reset
          </button>
        </div>
      </div>
    )
  }
}
