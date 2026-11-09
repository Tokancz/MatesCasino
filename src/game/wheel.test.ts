import { describe, expect, it } from 'vitest'
import { POCKET_COUNT, WHEEL_SEQUENCE, pocketColor, pocketIndex } from './wheel'

describe('wheel', () => {
  it('contains every number 0–36 exactly once', () => {
    expect(POCKET_COUNT).toBe(37)
    expect([...WHEEL_SEQUENCE].sort((a, b) => a - b)).toEqual(Array.from({ length: 37 }, (_, i) => i))
  })

  it('alternates red and black around the wheel', () => {
    for (let i = 1; i < POCKET_COUNT - 1; i++) {
      expect(pocketColor(WHEEL_SEQUENCE[i]!)).not.toBe(pocketColor(WHEEL_SEQUENCE[i + 1]!))
    }
  })

  it('colours numbers correctly', () => {
    expect(pocketColor(0)).toBe('green')
    expect(pocketColor(1)).toBe('red')
    expect(pocketColor(2)).toBe('black')
    expect(pocketColor(36)).toBe('red')
  })

  it('finds pocket indices', () => {
    expect(pocketIndex(0)).toBe(0)
    expect(pocketIndex(26)).toBe(36)
    expect(() => pocketIndex(37)).toThrow(RangeError)
  })
})
