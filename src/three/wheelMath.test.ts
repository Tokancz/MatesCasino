import { describe, expect, it } from 'vitest'
import { TAU, ballTravel, pocketAngle, progressBetween, wrap } from './wheelMath'

describe('wheelMath', () => {
  it('spaces pockets evenly', () => {
    const step = Math.abs(wrap(pocketAngle(32) - pocketAngle(0)))
    expect(Math.min(step, TAU - step)).toBeCloseTo(TAU / 37)
  })

  it('makes the ball end exactly on the target pocket after the requested laps', () => {
    for (const [from, to] of [
      [0, 1],
      [2, 0.5],
      [-4, 9],
    ] as const) {
      const travel = ballTravel(from, to, 10)
      expect(travel).toBeLessThan(-TAU * 10)
      expect(travel).toBeGreaterThanOrEqual(-TAU * 11)
      expect(wrap(from + travel)).toBeCloseTo(wrap(to))
    }
  })

  it('maps progress between bounds', () => {
    expect(progressBetween(0.5, 0.4, 0.6)).toBeCloseTo(0.5)
    expect(progressBetween(0.1, 0.4, 0.6)).toBe(0)
    expect(progressBetween(0.9, 0.4, 0.6)).toBe(1)
  })
})
