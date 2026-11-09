/**
 * Betting layout in abstract "layout units".
 *
 *   u → along the table (one unit = one number column), v ↑ away from the player.
 *
 *   v=3 ┌────┬──┬──┬── … ──┬──┬─────┐
 *       │    │ 3│ 6│       │36│ 2:1 │
 *       │ 0  │ 2│ 5│       │35│ 2:1 │
 *       │    │ 1│ 4│       │34│ 2:1 │
 *   v=0 └────┼──┴──┴── … ──┴──┼─────┘
 *            │ 1st 12 │ 2nd 12 │ 3rd 12 │          v ∈ [-1, 0)
 *            │1-18│EVEN│RED│BLACK│ODD│19-36│       v ∈ [-2, -1)
 *          u=-1  u=0                   u=12  u=13
 *
 * Pointer positions are mapped to bet spots with `spotAt`, so the 3D layer only needs to
 * convert a world-space hit into (u, v).
 */
import type { BetKind, BetSpot } from './bets'

export interface Rect {
  u: number
  v: number
  width: number
  height: number
}

export const LAYOUT_BOUNDS: Rect = { u: -1, v: -2, width: 14, height: 5 }

/** How close (in layout units) the pointer must be to a line to hit a split/corner/street. */
export const EDGE_TOLERANCE = 0.2

const COLUMNS = 12
const ROWS = 3

const numberAt = (col: number, row: number): number => col * ROWS + row + 1
const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i)

function spot(kind: BetKind, numbers: number[], anchor: BetSpot['anchor'], label: string): BetSpot {
  const sorted = [...numbers].sort((a, b) => a - b)
  return { id: `${kind}:${sorted.join('-')}`, kind, numbers: sorted, anchor, label }
}

const OUTSIDE_EVEN_MONEY: { kind: BetKind; label: string; numbers: number[] }[] = [
  { kind: 'low', label: '1 – 18', numbers: range(1, 18) },
  { kind: 'even', label: 'Even', numbers: range(1, 36).filter((n) => n % 2 === 0) },
  { kind: 'red', label: 'Red', numbers: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36] },
  { kind: 'black', label: 'Black', numbers: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35] },
  { kind: 'odd', label: 'Odd', numbers: range(1, 36).filter((n) => n % 2 === 1) },
  { kind: 'high', label: '19 – 36', numbers: range(19, 36) },
]

function insideSpotAt(u: number, v: number): BetSpot | null {
  const lx = Math.round(u)
  const ly = Math.round(v)
  const nearX = Math.abs(u - lx) < EDGE_TOLERANCE && lx >= 0 && lx < COLUMNS
  const nearY = Math.abs(v - ly) < EDGE_TOLERANCE && ly >= 0 && ly < ROWS
  const col = Math.min(Math.floor(u), COLUMNS - 1)
  const row = Math.min(Math.max(Math.floor(v), 0), ROWS - 1)

  if (nearX && nearY) {
    if (lx === 0 && ly === 0) return spot('firstFour', [0, 1, 2, 3], { u: 0, v: 0 }, 'First four 0–3')
    if (lx === 0) {
      const nums = [0, ly, ly + 1]
      return spot('trio', nums, { u: 0, v: ly }, `Trio ${nums.join('/')}`)
    }
    if (ly === 0) {
      const first = numberAt(lx - 1, 0)
      return spot('sixLine', range(first, first + 5), { u: lx, v: 0 }, `Six line ${first}–${first + 5}`)
    }
    const nums = [numberAt(lx - 1, ly - 1), numberAt(lx - 1, ly), numberAt(lx, ly - 1), numberAt(lx, ly)]
    return spot('corner', nums, { u: lx, v: ly }, `Corner ${nums.join('/')}`)
  }

  if (nearY && u >= 0) {
    if (ly === 0) {
      const first = numberAt(col, 0)
      return spot('street', range(first, first + 2), { u: col + 0.5, v: 0 }, `Street ${first}–${first + 2}`)
    }
    const nums = [numberAt(col, ly - 1), numberAt(col, ly)]
    return spot('split', nums, { u: col + 0.5, v: ly }, `Split ${nums.join('/')}`)
  }

  if (v < 0) return null

  if (nearX) {
    const nums = lx === 0 ? [0, row + 1] : [numberAt(lx - 1, row), numberAt(lx, row)]
    return spot('split', nums, { u: lx, v: row + 0.5 }, `Split ${nums.join('/')}`)
  }

  if (u < 0) return spot('straight', [0], { u: -0.5, v: 1.5 }, '0')
  const n = numberAt(col, row)
  return spot('straight', [n], { u: col + 0.5, v: row + 0.5 }, String(n))
}

/** Resolve a layout position to the bet spot under it, or null for dead space. */
export function spotAt(u: number, v: number): BetSpot | null {
  if (u >= -1 && u < COLUMNS && v >= -EDGE_TOLERANCE && v <= ROWS) {
    const inside = insideSpotAt(u, v)
    if (inside) return inside
  }

  if (u >= COLUMNS && u <= COLUMNS + 1 && v >= 0 && v < ROWS) {
    const r = Math.floor(v)
    const nums = range(0, 11).map((c) => numberAt(c, r))
    return spot('column', nums, { u: COLUMNS + 0.5, v: r + 0.5 }, `Column ${r + 1} · 2 to 1`)
  }

  if (u < 0 || u >= COLUMNS) return null

  if (v >= -1 && v < 0) {
    const d = Math.floor(u / 4)
    return spot('dozen', range(d * 12 + 1, d * 12 + 12), { u: d * 4 + 2, v: -0.5 }, `${['1st', '2nd', '3rd'][d]} 12`)
  }

  if (v >= -2 && v < -1) {
    const i = Math.floor(u / 2)
    const def = OUTSIDE_EVEN_MONEY[i]!
    return { id: def.kind, kind: def.kind, numbers: def.numbers, label: def.label, anchor: { u: i * 2 + 1, v: -1.5 } }
  }

  return null
}

/** Cell occupied by a number on the layout. */
export function numberCell(n: number): Rect {
  if (n === 0) return { u: -1, v: 0, width: 1, height: ROWS }
  const i = n - 1
  return { u: Math.floor(i / ROWS), v: i % ROWS, width: 1, height: 1 }
}

/** Printed area of an outside bet (null for inside bets, which are drawn via their numbers). */
export function outsideRect(spot: BetSpot): Rect | null {
  const { u, v } = spot.anchor
  switch (spot.kind) {
    case 'column':
      return { u: COLUMNS, v: Math.floor(v), width: 1, height: 1 }
    case 'dozen':
      return { u: u - 2, v: -1, width: 4, height: 1 }
    case 'red':
    case 'black':
    case 'odd':
    case 'even':
    case 'low':
    case 'high':
      return { u: u - 1, v: -2, width: 2, height: 1 }
    default:
      return null
  }
}
