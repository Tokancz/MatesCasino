import { WHEEL } from '@/config/scene'
import { POCKET_COUNT, pocketIndex } from '@/game/wheel'

export const TAU = Math.PI * 2

/** Angle (around +Y, wheel-top local space) of the centre of a number's pocket. */
export function pocketAngle(n: number): number {
  const direction = WHEEL.clockwise ? -1 : 1
  return WHEEL.zeroAngle + direction * pocketIndex(n) * (TAU / POCKET_COUNT)
}

/** Positive modulo. */
export const wrap = (value: number, period = TAU): number => ((value % period) + period) % period

/**
 * Relative travel (always negative = against the wheel's spin) that brings the ball from
 * `from` to exactly `to` after roughly `laps` full laps.
 */
export function ballTravel(from: number, to: number, laps: number): number {
  return wrap(to - from) - TAU * (laps + 1)
}

export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3
export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2
export const clamp01 = (t: number): number => Math.min(1, Math.max(0, t))
/** Maps `value` from [start, end] to [0, 1], clamped. */
export const progressBetween = (value: number, start: number, end: number): number =>
  clamp01((value - start) / (end - start))
