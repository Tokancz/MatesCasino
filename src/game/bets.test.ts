import { describe, expect, it } from 'vitest'
import { betReturn, totalReturn, totalStake } from './bets'
import { spotAt } from './layout'

describe('payouts', () => {
  const straight17 = { spot: spotAt(5.5, 1.5)!, amount: 1_000 }
  const red = { spot: spotAt(4.5, -1.5)!, amount: 5_000 }

  it('pays straight-up 35 to 1 plus stake', () => {
    expect(straight17.spot.numbers).toEqual([17])
    expect(betReturn(straight17, 17)).toBe(36_000)
    expect(betReturn(straight17, 18)).toBe(0)
  })

  it('pays even money and loses on zero', () => {
    expect(betReturn(red, 1)).toBe(10_000)
    expect(betReturn(red, 0)).toBe(0)
  })

  it('sums stakes and returns', () => {
    expect(totalStake([straight17, red])).toBe(6_000)
    expect(totalReturn([straight17, red], 17)).toBe(36_000) // 17 is black
  })
})
