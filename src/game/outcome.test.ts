import { describe, expect, it } from 'vitest'
import { totalReturn } from './bets'
import { spotAt } from './layout'
import { drawOutcome } from './outcome'

/** Deterministic PRNG (mulberry32) so statistical tests are reproducible. */
function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const redBet = [{ spot: spotAt(4.5, -1.5)!, amount: 1_000 }]

function winRate(houseBias: number, spins = 20_000): number {
  const random = seeded(42)
  let wins = 0
  for (let i = 0; i < spins; i++) {
    if (totalReturn(redBet, drawOutcome(redBet, { houseBias, random })) > 0) wins++
  }
  return wins / spins
}

describe('drawOutcome', () => {
  it('always returns a valid number', () => {
    const random = seeded(1)
    for (let i = 0; i < 1000; i++) {
      const n = drawOutcome(redBet, { houseBias: 0.5, random })
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(36)
    }
  })

  it('is fair with zero bias (~18/37 for red)', () => {
    expect(winRate(0)).toBeCloseTo(18 / 37, 1)
  })

  it('lowers the player win rate as bias increases', () => {
    const fair = winRate(0)
    const biased = winRate(0.3)
    expect(biased).toBeLessThan(fair)
    expect(biased).toBeCloseTo((18 / 37) * 0.7, 1)
  })

  it('never lets the player profit with full bias', () => {
    const straight = [{ spot: spotAt(5.5, 1.5)!, amount: 1_000 }]
    const random = seeded(7)
    for (let i = 0; i < 2000; i++) {
      expect(totalReturn(straight, drawOutcome(straight, { houseBias: 1, random }))).toBe(0)
    }
  })
})
