import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { useGameStore } from './store/useGameStore'

describe('progressive navigation', () => {
  beforeEach(() => {
    useGameStore.getState().hardReset()
  })

  it('redirects /mid to home when board capacity is still 1', () => {
    render(
      <MemoryRouter initialEntries={['/mid']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('heading', { name: /boards ·/i })).not.toBeInTheDocument()
    expect(screen.getByText(/rage meter/i)).toBeInTheDocument()
  })

  it('shows Mid when unlocked and route is /mid', async () => {
    useGameStore.setState({ boardSlots: 2 })
    render(
      <MemoryRouter initialEntries={['/mid']}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /boards ·/i })).toBeInTheDocument()
    })
  })

  it('redirects /late when prestiges below threshold', () => {
    render(
      <MemoryRouter initialEntries={['/late']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('heading', { name: /^farms$/i })).not.toBeInTheDocument()
    expect(screen.getByText(/rage meter/i)).toBeInTheDocument()
  })

  it('shows Late when prestiges threshold met', async () => {
    useGameStore.setState({
      lifetime: { ...useGameStore.getState().lifetime, prestiges: 2 },
    })
    render(
      <MemoryRouter initialEntries={['/late']}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^farms$/i })).toBeInTheDocument()
    })
  })

  it('navigates to shop via shop link', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('link', { name: /^shop$/i }))
    expect(screen.getByText(/Unlock bots via milestones/i)).toBeInTheDocument()
  })
})
