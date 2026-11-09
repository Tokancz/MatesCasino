export const DENOMINATIONS = [1_000, 5_000, 25_000, 100_000] as const
export type Denomination = (typeof DENOMINATIONS)[number]

export type ChipCounts = Record<Denomination, number>

export const emptyChipCounts = (): ChipCounts => ({ 1000: 0, 5000: 0, 25000: 0, 100000: 0 })

export function isDenomination(value: number): value is Denomination {
  return (DENOMINATIONS as readonly number[]).includes(value)
}

/** Value of a set of chips. */
export function chipsValue(counts: ChipCounts): number {
  return DENOMINATIONS.reduce((sum, d) => sum + d * counts[d], 0)
}

/**
 * Greedy breakdown of an amount into the fewest chips, largest first.
 * Any remainder smaller than the smallest denomination is returned separately.
 */
export function breakdown(amount: number): { chips: Denomination[]; remainder: number } {
  const chips: Denomination[] = []
  let rest = Math.max(0, Math.floor(amount))
  for (const d of [...DENOMINATIONS].reverse()) {
    while (rest >= d) {
      chips.push(d)
      rest -= d
    }
  }
  return { chips, remainder: rest }
}

export function countChips(chips: readonly Denomination[]): ChipCounts {
  const counts = emptyChipCounts()
  for (const c of chips) counts[c]++
  return counts
}

/** "1K", "25K", "1.5M" */
export function shortAmount(value: number): string {
  if (value >= 1_000_000) return `${+(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${+(value / 1_000).toFixed(1)}K`
  return String(value)
}
