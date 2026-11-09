import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STARTING_CASH, STARTING_CHIPS } from '@/config/game'
import { chipsValue } from '@/game/chips'
import { spotAt } from '@/game/layout'
import { useRouletteStore } from './roulette'
import { useWalletStore } from './wallet'

const RED = spotAt(4.5, -1.5)!
const STRAIGHT_17 = spotAt(5.5, 1.5)!
const startingWorth = STARTING_CASH + chipsValue(STARTING_CHIPS)

beforeEach(() => {
  setActivePinia(createPinia())
  vi.restoreAllMocks()
})

describe('wallet', () => {
  it('starts with the configured bankroll', () => {
    const wallet = useWalletStore()
    expect(wallet.netWorth).toBe(startingWorth)
  })

  it('exchanges cash and chips without changing net worth', () => {
    const wallet = useWalletStore()
    expect(wallet.buyChips(25_000, 2)).toBe(true)
    expect(wallet.cash).toBe(STARTING_CASH - 50_000)
    expect(wallet.sellChips(25_000, 1)).toBe(true)
    wallet.cashOutAll()
    expect(wallet.chipsInHand).toBe(0)
    expect(wallet.netWorth).toBe(startingWorth)
  })

  it('refuses purchases it cannot afford and sales of chips it lacks', () => {
    const wallet = useWalletStore()
    expect(wallet.buyChips(100_000, 1000)).toBe(false)
    expect(wallet.sellChips(100_000, 99)).toBe(false)
    expect(wallet.netWorth).toBe(startingWorth)
  })
})

describe('roulette round', () => {
  it('places, removes and undoes chips', () => {
    const table = useRouletteStore()
    const wallet = useWalletStore()

    expect(table.placeChip(RED, 1_000)).toBeNull()
    expect(table.placeChip(RED, 5_000)).toBeNull()
    expect(table.placeChip(STRAIGHT_17, 1_000)).toBeNull()
    expect(table.totalStake).toBe(7_000)
    expect(wallet.stakedValue).toBe(7_000)

    table.removeChip(RED.id) // removes the 5K
    expect(table.totalStake).toBe(2_000)
    table.undo() // removes the chip on 17
    expect(table.bets.map((b) => b.spot.id)).toEqual([RED.id])
    table.clearBets()
    expect(table.totalStake).toBe(0)
    expect(wallet.netWorth).toBe(startingWorth)
  })

  it('rejects bets without chips', () => {
    const table = useRouletteStore()
    const wallet = useWalletStore()
    wallet.cashOutAll()
    expect(table.placeChip(RED)).toBe('no-chips')
  })

  it('pays a winning bet and records history', () => {
    vi.spyOn(Math, 'random').mockReturnValue(17 / 37 + 0.001) // fair draw → 17, then no house redraw
    const table = useRouletteStore()
    const wallet = useWalletStore()

    table.placeChip(STRAIGHT_17, 1_000)
    expect(table.startSpin()).toBe(17)
    expect(table.phase).toBe('spinning')
    expect(table.placeChip(RED)).toBe('table-closed')

    const round = table.settle()!
    expect(round).toMatchObject({ number: 17, stake: 1_000, payout: 36_000, winningSpotIds: [STRAIGHT_17.id] })
    expect(wallet.netWorth).toBe(startingWorth + 35_000)
    expect(table.history).toEqual([{ round: 1, number: 17 }])

    table.nextRound()
    expect(table.phase).toBe('betting')
    expect(table.totalStake).toBe(0)
  })

  it('takes losing stakes and can repeat the previous bets', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // → 0, a loss for red
    const table = useRouletteStore()
    const wallet = useWalletStore()

    table.placeChip(RED, 5_000)
    table.startSpin()
    table.settle()
    table.nextRound()
    expect(wallet.netWorth).toBe(startingWorth - 5_000)

    expect(table.rebet()).toBeNull()
    expect(table.totalStake).toBe(5_000)
  })

  it('does not spin an empty table', () => {
    expect(useRouletteStore().startSpin()).toBeNull()
  })
})
