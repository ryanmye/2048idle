import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '../store/useGameStore'
import { EarlyScreen } from './EarlyScreen'

describe('EarlyScreen', () => {
  beforeEach(() => {
    useGameStore.getState().hardReset()
  })

  it('renders the manual board and rage meter', () => {
    render(
      <MemoryRouter>
        <EarlyScreen />
      </MemoryRouter>,
    )
    expect(screen.getByText(/rage meter/i)).toBeInTheDocument()
    expect(screen.getByText(/your first bot/i)).toBeInTheDocument()
  })

  it('shows shop CTA disabled when locked', () => {
    render(
      <MemoryRouter>
        <EarlyScreen />
      </MemoryRouter>,
    )
    const cta = screen.getByRole('button', { name: /locked/i })
    expect(cta).toBeDisabled()
  })
})
