import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './useGameStore'
import { BALANCE } from '../data/balance'

const reset = () => useGameStore.getState().hardReset()

describe('useGameStore', () => {
  beforeEach(() => {
    reset()
  })

  it('starts with one manual board and zero bots', () => {
    const s = useGameStore.getState()
    expect(s.boards).toHaveLength(1)
    expect(s.bots).toHaveLength(0)
    expect(s.boards[0].ownerBotId).toBe('manual')
  })

  it('refuses to buy a bot you cannot afford', () => {
    useGameStore.setState({ unlockedBotTypes: ['lu'], points: 500 })
    useGameStore.getState().buyBot('lu')
    expect(useGameStore.getState().bots).toHaveLength(0)
    expect(useGameStore.getState().points).toBe(500)
  })

  it('buys a bot and deducts cost (and applies first-bot bonus)', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 1000 })
    useGameStore.getState().buyBot('rand')
    expect(useGameStore.getState().bots).toHaveLength(1)
    // First Random Walker is free; +50 (first-bot achievement reward) = 1050
    expect(useGameStore.getState().points).toBe(1050)
  })

  it('upgrades only when affordable and below max', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 100_000 })
    useGameStore.getState().buyBot('rand')
    const uid = useGameStore.getState().bots[0].uid
    useGameStore.getState().buyUpgrade(uid, 'speed')
    expect(useGameStore.getState().bots[0].upgrades.speed).toBe(1)
  })

  it('refuses prestige below threshold', () => {
    expect(useGameStore.getState().canPrestige()).toBe(false)
    useGameStore.getState().prestige()
    expect(useGameStore.getState().prestigeLevel).toBe(0)
  })

  it('grants prestige tokens above the threshold', () => {
    useGameStore.setState({
      lifetime: { ...useGameStore.getState().lifetime, totalPts: BALANCE.prestige.minimumTotalPts * 10 },
    })
    expect(useGameStore.getState().canPrestige()).toBe(true)
    useGameStore.getState().prestige()
    expect(useGameStore.getState().prestigeLevel).toBe(1)
    expect(useGameStore.getState().prestigeTokens).toBeGreaterThan(0)
  })

  it('export/import round-trips', () => {
    useGameStore.setState({ points: 12345 })
    const json = useGameStore.getState().exportSave()
    reset()
    expect(useGameStore.getState().points).toBe(0)
    expect(useGameStore.getState().importSave(json)).toBe(true)
    expect(useGameStore.getState().points).toBe(12345)
  })

  it('refuses garbage import', () => {
    expect(useGameStore.getState().importSave('not json')).toBe(false)
  })

  it('bot still plays while detail route allows player moves on that board', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 1000 })
    useGameStore.getState().buyBot('rand')
    expect(useGameStore.getState().boards[0].ownerBotId).not.toBe('manual')
    useGameStore.setState({ detailRouteBoardId: 'board-1' })
    const t0 = useGameStore.getState().lastTickAt
    useGameStore.getState().tick(t0 + 5000)
    expect(useGameStore.getState().bots[0].lifetime.moves).toBeGreaterThan(0)
  })

  it('capacity purchase raises boardSlots without adding a board row', () => {
    useGameStore.setState({ points: 100_000 })
    expect(useGameStore.getState().boards).toHaveLength(1)
    useGameStore.getState().buyBoardSlot()
    expect(useGameStore.getState().boardSlots).toBe(2)
    expect(useGameStore.getState().boards).toHaveLength(1)
  })

  it('buying a bot with spare capacity spawns a new board', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 2000, boardSlots: 2 })
    expect(useGameStore.getState().boards).toHaveLength(1)
    useGameStore.getState().buyBot('rand')
    expect(useGameStore.getState().boards).toHaveLength(2)
    expect(useGameStore.getState().bots[0].boardId).toBe('board-2')
    expect(useGameStore.getState().boards[1].ownerBotId).toBe(useGameStore.getState().bots[0].uid)
  })

  it('disabled bot does not gain moves from ticks', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 1000 })
    useGameStore.getState().buyBot('rand')
    const uid = useGameStore.getState().bots[0].uid
    useGameStore.getState().setBotEnabled(uid, false)
    const t0 = useGameStore.getState().lastTickAt
    useGameStore.getState().tick(t0 + 5000)
    expect(useGameStore.getState().bots[0].lifetime.moves).toBe(0)
  })

  it('preserves boardNames through prestige', () => {
    useGameStore.getState().renameBoard('board-1', 'cozy nook')
    useGameStore.setState({
      lifetime: { ...useGameStore.getState().lifetime, totalPts: BALANCE.prestige.minimumTotalPts * 10 },
    })
    useGameStore.getState().prestige()
    expect(useGameStore.getState().boardNames['board-1']).toBe('cozy nook')
  })

  it('assigns monotonic bot serials on purchase', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 100_000, boardSlots: 3 })
    useGameStore.getState().buyBot('rand')
    expect(useGameStore.getState().bots[0].serial).toBe(0)
    expect(useGameStore.getState().nextBotSerial).toBe(1)
    useGameStore.getState().buyBot('rand')
    expect(useGameStore.getState().bots[1].serial).toBe(1)
    expect(useGameStore.getState().nextBotSerial).toBe(2)
  })

  it('does not reuse serial after selling a bot', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 100_000, boardSlots: 3 })
    useGameStore.getState().buyBot('rand')
    useGameStore.getState().buyBot('rand')
    expect(useGameStore.getState().nextBotSerial).toBe(2)
    const soldUid = useGameStore.getState().bots[0].uid
    useGameStore.getState().sellBot(soldUid)
    useGameStore.getState().buyBot('rand')
    const serials = useGameStore.getState().bots.map((b) => b.serial).sort((a, b) => a - b)
    expect(serials).toContain(2)
    expect(useGameStore.getState().nextBotSerial).toBe(3)
  })

  it('preserves nextBotSerial through prestige', () => {
    useGameStore.setState({
      unlockedBotTypes: ['rand'],
      points: 100_000,
      lifetime: { ...useGameStore.getState().lifetime, totalPts: BALANCE.prestige.minimumTotalPts * 10 },
    })
    useGameStore.getState().buyBot('rand')
    expect(useGameStore.getState().nextBotSerial).toBe(1)
    useGameStore.getState().prestige()
    expect(useGameStore.getState().nextBotSerial).toBe(1)
  })

  it('renameBot charges points and sets nickname', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 100_000 })
    useGameStore.getState().buyBot('rand')
    const uid = useGameStore.getState().bots[0].uid
    const pts = useGameStore.getState().points
    useGameStore.getState().renameBot(uid, 'scout')
    expect(useGameStore.getState().bots[0].nickname).toBe('scout')
    expect(useGameStore.getState().points).toBe(pts - BALANCE.bot.renameCostPts)
  })

  it('renameBot refuses when below rename cost', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 100_000 })
    useGameStore.getState().buyBot('rand')
    const uid = useGameStore.getState().bots[0].uid
    useGameStore.setState({ points: BALANCE.bot.renameCostPts - 1 })
    useGameStore.getState().renameBot(uid, 'nope')
    expect(useGameStore.getState().bots[0].nickname).toBe(null)
    expect(useGameStore.getState().points).toBe(BALANCE.bot.renameCostPts - 1)
  })

  it('renameBot does not charge when nickname unchanged', () => {
    useGameStore.setState({ unlockedBotTypes: ['rand'], points: 100_000 })
    useGameStore.getState().buyBot('rand')
    const uid = useGameStore.getState().bots[0].uid
    const pts = useGameStore.getState().points
    useGameStore.getState().renameBot(uid, 'scout')
    const afterFirst = useGameStore.getState().points
    useGameStore.getState().renameBot(uid, 'scout')
    expect(useGameStore.getState().points).toBe(afterFirst)
    expect(useGameStore.getState().points).toBe(pts - BALANCE.bot.renameCostPts)
  })
})
