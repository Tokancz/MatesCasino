/** European single-zero wheel, pockets listed clockwise starting at 0. */
export const WHEEL_SEQUENCE = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
] as const

export const POCKET_COUNT = WHEEL_SEQUENCE.length

export type PocketColor = 'red' | 'black' | 'green'

const RED_NUMBERS: ReadonlySet<number> = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

export function pocketColor(n: number): PocketColor {
  if (n === 0) return 'green'
  return RED_NUMBERS.has(n) ? 'red' : 'black'
}

/** Index of a number on the physical wheel (0..36). */
export function pocketIndex(n: number): number {
  const index = (WHEEL_SEQUENCE as readonly number[]).indexOf(n)
  if (index < 0) throw new RangeError(`Not a roulette number: ${n}`)
  return index
}

export const ALL_NUMBERS: readonly number[] = Array.from({ length: POCKET_COUNT }, (_, i) => i)
