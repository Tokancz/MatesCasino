import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { STARTING_CASH, STARTING_CHIPS, STORAGE_KEY } from '@/config/game'
import { type ChipCounts, type Denomination, DENOMINATIONS, breakdown, chipsValue, emptyChipCounts } from '@/game/chips'

interface SavedWallet {
  cash: number
  chips: ChipCounts
}

/**
 * The player's money: cash, chips in hand and chips currently staked on the table.
 * Staked chips are persisted as if they were still in hand, so reloading mid-bet loses nothing.
 */
export const useWalletStore = defineStore('wallet', () => {
  const saved = load()
  const cash = ref(saved?.cash ?? STARTING_CASH)
  const chips = ref<ChipCounts>(saved?.chips ?? { ...STARTING_CHIPS })
  const staked = ref<ChipCounts>(emptyChipCounts())

  const chipsInHand = computed(() => chipsValue(chips.value))
  const stakedValue = computed(() => chipsValue(staked.value))
  const netWorth = computed(() => cash.value + chipsInHand.value + stakedValue.value)
  const isBroke = computed(() => netWorth.value < DENOMINATIONS[0])

  function buyChips(denomination: Denomination, quantity = 1): boolean {
    const cost = denomination * quantity
    if (quantity <= 0 || cost > cash.value) return false
    cash.value -= cost
    chips.value[denomination] += quantity
    return true
  }

  function sellChips(denomination: Denomination, quantity = 1): boolean {
    if (quantity <= 0 || chips.value[denomination] < quantity) return false
    chips.value[denomination] -= quantity
    cash.value += denomination * quantity
    return true
  }

  function cashOutAll(): void {
    cash.value += chipsInHand.value
    chips.value = emptyChipCounts()
  }

  /** Moves one chip from hand onto the table. */
  function stake(denomination: Denomination): boolean {
    if (chips.value[denomination] <= 0) return false
    chips.value[denomination]--
    staked.value[denomination]++
    return true
  }

  /** Moves one chip from the table back to hand. */
  function unstake(denomination: Denomination): void {
    if (staked.value[denomination] <= 0) return
    staked.value[denomination]--
    chips.value[denomination]++
  }

  /** Staked chips go to the house; `payout` (stakes + winnings of winning bets) is paid in chips. */
  function settle(payout: number): void {
    const applied = withPayout(payout)
    cash.value = applied.cash
    chips.value = applied.chips
    staked.value = emptyChipCounts()
  }

  /**
   * Persist the post-round state as soon as the result is drawn,
   * so reloading during the spin animation can't undo a loss.
   */
  function commitPending(payout: number): void {
    save(withPayout(payout))
  }

  function reset(): void {
    cash.value = STARTING_CASH
    chips.value = { ...STARTING_CHIPS }
    staked.value = emptyChipCounts()
  }

  function withPayout(payout: number): SavedWallet {
    const next = { ...chips.value }
    const { chips: paid, remainder } = breakdown(payout)
    for (const chip of paid) next[chip]++
    return { cash: cash.value + remainder, chips: next }
  }

  watch(
    [cash, chips, staked],
    () => {
      const inHandAndStaked = { ...chips.value }
      for (const d of DENOMINATIONS) inHandAndStaked[d] += staked.value[d]
      save({ cash: cash.value, chips: inHandAndStaked })
    },
    { deep: true },
  )

  return {
    cash,
    chips,
    staked,
    chipsInHand,
    stakedValue,
    netWorth,
    isBroke,
    buyChips,
    sellChips,
    cashOutAll,
    stake,
    unstake,
    settle,
    commitPending,
    reset,
  }
})

function load(): SavedWallet | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<SavedWallet>
    if (typeof data.cash !== 'number' || !data.chips) return null
    const chips = emptyChipCounts()
    for (const d of DENOMINATIONS) chips[d] = Math.max(0, Math.floor(Number(data.chips[d]) || 0))
    return { cash: Math.max(0, data.cash), chips }
  } catch {
    return null
  }
}

function save(wallet: SavedWallet): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet))
  } catch {
    // Storage unavailable (private mode, quota): the session simply isn't persisted.
  }
}
