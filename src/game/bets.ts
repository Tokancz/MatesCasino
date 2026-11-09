export type BetKind =
  | 'straight'
  | 'split'
  | 'street'
  | 'trio'
  | 'corner'
  | 'firstFour'
  | 'sixLine'
  | 'column'
  | 'dozen'
  | 'red'
  | 'black'
  | 'odd'
  | 'even'
  | 'low'
  | 'high'

/** Payout odds "N to 1". */
export const PAYOUTS: Record<BetKind, number> = {
  straight: 35,
  split: 17,
  street: 11,
  trio: 11,
  corner: 8,
  firstFour: 8,
  sixLine: 5,
  column: 2,
  dozen: 2,
  red: 1,
  black: 1,
  odd: 1,
  even: 1,
  low: 1,
  high: 1,
}

/** A bettable position on the layout. */
export interface BetSpot {
  /** Stable identifier, e.g. "split:17-20" or "red". */
  id: string
  kind: BetKind
  numbers: readonly number[]
  label: string
  /** Where the chip stack sits, in layout units (see layout.ts). */
  anchor: { u: number; v: number }
}

export interface Bet {
  spot: BetSpot
  amount: number
}

export const isWinning = (spot: BetSpot, result: number): boolean => spot.numbers.includes(result)

/** Total returned to the player for a bet (stake + winnings), 0 if lost. */
export function betReturn(bet: Bet, result: number): number {
  return isWinning(bet.spot, result) ? bet.amount * (PAYOUTS[bet.spot.kind] + 1) : 0
}

export function totalReturn(bets: readonly Bet[], result: number): number {
  return bets.reduce((sum, b) => sum + betReturn(b, result), 0)
}

export const totalStake = (bets: readonly Bet[]): number => bets.reduce((s, b) => s + b.amount, 0)
