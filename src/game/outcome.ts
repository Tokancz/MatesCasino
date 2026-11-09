import { type Bet, totalReturn, totalStake } from './bets'
import { ALL_NUMBERS } from './wheel'

export interface OutcomeOptions {
  /**
   * Probability (0..1) that a spin which would leave the player in profit is
   * redrawn from the numbers where the house does not lose. 0 = fair wheel.
   */
  houseBias: number
  random?: () => number
}

const pick = <T>(items: readonly T[], random: () => number): T =>
  items[Math.min(items.length - 1, Math.floor(random() * items.length))]!

/**
 * Draw the winning number. Standard roulette already carries a 2.7 % house edge;
 * `houseBias` tilts it further on top of that.
 */
export function drawOutcome(bets: readonly Bet[], { houseBias, random = Math.random }: OutcomeOptions): number {
  const fair = pick(ALL_NUMBERS, random)
  const stake = totalStake(bets)
  if (stake === 0 || totalReturn(bets, fair) <= stake || random() >= houseBias) return fair

  const houseFriendly = ALL_NUMBERS.filter((n) => totalReturn(bets, n) <= stake)
  return houseFriendly.length > 0 ? pick(houseFriendly, random) : fair
}
