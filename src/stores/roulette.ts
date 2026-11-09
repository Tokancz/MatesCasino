import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { HOUSE_BIAS } from '@/config/game'
import { type Bet, type BetSpot, isWinning, totalReturn } from '@/game/bets'
import { type Denomination, DENOMINATIONS, countChips } from '@/game/chips'
import { drawOutcome } from '@/game/outcome'
import { useWalletStore } from './wallet'

export type Phase = 'betting' | 'spinning' | 'result'

export type BetError = 'table-closed' | 'no-chips' | 'nothing-to-repeat'

interface PlacedBet {
  spot: BetSpot
  chips: Denomination[]
}

export interface HistoryEntry {
  round: number
  number: number
}

export interface RoundResult {
  number: number
  stake: number
  payout: number
  winningSpotIds: string[]
}

const HISTORY_LENGTH = 16

export const useRouletteStore = defineStore('roulette', () => {
  const wallet = useWalletStore()

  const phase = ref<Phase>('betting')
  const selectedChip = ref<Denomination>(DENOMINATIONS[0])
  const placed = ref<Record<string, PlacedBet>>({})
  /** Spot ids in the order chips were placed, for undo. */
  const placementOrder = ref<string[]>([])
  const previousBets = ref<PlacedBet[]>([])
  const history = ref<HistoryEntry[]>([])
  let roundsPlayed = 0
  const lastRound = ref<RoundResult | null>(null)
  let pending: RoundResult | null = null

  const bets = computed<Bet[]>(() =>
    Object.values(placed.value).map(({ spot, chips }) => ({
      spot,
      amount: chips.reduce((sum, c) => sum + c, 0),
    })),
  )
  const totalStake = computed(() => bets.value.reduce((sum, b) => sum + b.amount, 0))
  const isBetting = computed(() => phase.value === 'betting')
  const canSpin = computed(() => isBetting.value && totalStake.value > 0)

  function selectChip(denomination: Denomination): void {
    selectedChip.value = denomination
  }

  function placeChip(spot: BetSpot, denomination = selectedChip.value): BetError | null {
    if (!isBetting.value) return 'table-closed'
    if (!wallet.stake(denomination)) return 'no-chips'
    const bet = (placed.value[spot.id] ??= { spot, chips: [] })
    bet.chips.push(denomination)
    placementOrder.value.push(spot.id)
    return null
  }

  /** Takes the most recently placed chip off a spot. */
  function removeChip(spotId: string): boolean {
    const bet = placed.value[spotId]
    if (!isBetting.value || !bet) return false
    wallet.unstake(bet.chips.pop()!)
    if (bet.chips.length === 0) delete placed.value[spotId]
    const index = placementOrder.value.lastIndexOf(spotId)
    if (index >= 0) placementOrder.value.splice(index, 1)
    return true
  }

  function undo(): boolean {
    const last = placementOrder.value.at(-1)
    return last !== undefined && removeChip(last)
  }

  function clearBets(): void {
    while (undo());
  }

  /** Re-places last round's bets, if the player still holds the chips. */
  function rebet(): BetError | null {
    if (!isBetting.value) return 'table-closed'
    if (previousBets.value.length === 0) return 'nothing-to-repeat'
    const needed = countChips(previousBets.value.flatMap((b) => b.chips))
    if (DENOMINATIONS.some((d) => wallet.chips[d] < needed[d])) return 'no-chips'
    clearBets()
    for (const { spot, chips } of previousBets.value) for (const chip of chips) placeChip(spot, chip)
    return null
  }

  /** Draws the result and locks the table. Returns null when there is nothing to spin for. */
  function startSpin(): number | null {
    if (!canSpin.value) return null
    const number = drawOutcome(bets.value, { houseBias: HOUSE_BIAS })
    pending = {
      number,
      stake: totalStake.value,
      payout: totalReturn(bets.value, number),
      winningSpotIds: bets.value.filter((b) => isWinning(b.spot, number)).map((b) => b.spot.id),
    }
    wallet.commitPending(pending.payout)
    phase.value = 'spinning'
    return number
  }

  /** Pays out once the ball has landed. */
  function settle(): RoundResult | null {
    if (phase.value !== 'spinning' || !pending) return null
    const round = pending
    pending = null
    wallet.settle(round.payout)
    history.value = [{ round: ++roundsPlayed, number: round.number }, ...history.value].slice(0, HISTORY_LENGTH)
    lastRound.value = round
    phase.value = 'result'
    return round
  }

  /** Clears the table and reopens betting. */
  function nextRound(): void {
    if (phase.value !== 'result') return
    previousBets.value = Object.values(placed.value)
    placed.value = {}
    placementOrder.value = []
    phase.value = 'betting'
  }

  return {
    phase,
    selectedChip,
    bets,
    totalStake,
    isBetting,
    canSpin,
    history,
    lastRound,
    hasPreviousBets: computed(() => previousBets.value.length > 0),
    selectChip,
    placeChip,
    removeChip,
    undo,
    clearBets,
    rebet,
    startSpin,
    settle,
    nextRound,
  }
})
