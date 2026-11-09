import { describe, expect, it } from 'vitest'
import { breakdown, chipsValue, countChips, shortAmount } from './chips'

describe('chips', () => {
  it('breaks amounts into the fewest chips', () => {
    expect(breakdown(131_000)).toEqual({ chips: [100_000, 25_000, 5_000, 1_000], remainder: 0 })
    expect(breakdown(2_500).chips).toEqual([1_000, 1_000])
    expect(breakdown(2_500).remainder).toBe(500)
    expect(breakdown(-5).chips).toEqual([])
  })

  it('counts and values chips', () => {
    const counts = countChips([1_000, 1_000, 100_000])
    expect(counts[1000]).toBe(2)
    expect(chipsValue(counts)).toBe(102_000)
  })

  it('formats short amounts', () => {
    expect(shortAmount(1_000)).toBe('1K')
    expect(shortAmount(25_000)).toBe('25K')
    expect(shortAmount(1_250_000)).toBe('1.25M')
  })
})
