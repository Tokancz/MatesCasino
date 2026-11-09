import { describe, expect, it } from 'vitest'
import { numberCell, outsideRect, spotAt } from './layout'

const at = (u: number, v: number) => spotAt(u, v)

describe('spotAt', () => {
  it('resolves straight-up numbers from cell centres', () => {
    for (let n = 1; n <= 36; n++) {
      const cell = numberCell(n)
      const s = at(cell.u + 0.5, cell.v + 0.5)
      expect(s?.kind).toBe('straight')
      expect(s?.numbers).toEqual([n])
    }
    expect(at(-0.5, 1.5)?.numbers).toEqual([0])
  })

  it('resolves splits on shared edges', () => {
    expect(at(1, 0.5)?.numbers).toEqual([1, 4]) // between columns
    expect(at(0.5, 1)?.numbers).toEqual([1, 2]) // between rows
    expect(at(0, 2.5)?.numbers).toEqual([0, 3]) // with zero
  })

  it('resolves corners, streets, six lines, trios and first four', () => {
    expect(at(1, 1)).toMatchObject({ kind: 'corner', numbers: [1, 2, 4, 5] })
    expect(at(5.5, 0)).toMatchObject({ kind: 'street', numbers: [16, 17, 18] })
    expect(at(5.5, -0.1)).toMatchObject({ kind: 'street' })
    expect(at(3, 0)).toMatchObject({ kind: 'sixLine', numbers: [7, 8, 9, 10, 11, 12] })
    expect(at(0, 2)).toMatchObject({ kind: 'trio', numbers: [0, 2, 3] })
    expect(at(0, 0)).toMatchObject({ kind: 'firstFour', numbers: [0, 1, 2, 3] })
  })

  it('resolves outside bets', () => {
    expect(at(12.5, 2.5)).toMatchObject({ kind: 'column', id: 'column:3-6-9-12-15-18-21-24-27-30-33-36' })
    expect(at(6, -0.6)).toMatchObject({ kind: 'dozen', numbers: Array.from({ length: 12 }, (_, i) => i + 13) })
    expect(at(4.5, -1.5)?.id).toBe('red')
    expect(at(6.5, -1.5)?.id).toBe('black')
    expect(at(11.5, -1.5)?.id).toBe('high')
  })

  it('returns null outside the layout', () => {
    expect(at(-0.5, -1)).toBeNull()
    expect(at(12.5, -1)).toBeNull()
    expect(at(5, 4)).toBeNull()
    expect(at(-3, 1)).toBeNull()
  })

  it('produces stable ids for the same spot', () => {
    expect(at(1.02, 0.4)?.id).toBe(at(0.98, 0.6)?.id)
  })
})

describe('outsideRect', () => {
  it('returns printed areas only for outside bets', () => {
    expect(outsideRect(at(4.5, -1.5)!)).toEqual({ u: 4, v: -2, width: 2, height: 1 })
    expect(outsideRect(at(0.5, 0.5)!)).toBeNull()
  })
})
