import { Raycaster, Vector3, type Object3D } from 'three'
import { boundsOf } from './assets'
import { TAU } from './wheelMath'

/** Surface height (local Y) of a round object as a function of distance from its axis. */
export type RadialProfile = (radius: number) => number

/**
 * Samples the surface of `root` (in its local frame) along rays cast straight down at
 * `angles` evenly spaced directions per radius step. The median across directions ignores thin
 * features such as pocket separators, giving the floor a rolling ball would follow.
 */
export function sampleRadialProfile(root: Object3D, maxRadius: number, step = 0.0025, angles = 24): RadialProfile {
  root.updateMatrixWorld(true)
  const raycaster = new Raycaster()
  const down = new Vector3(0, -1, 0).transformDirection(root.matrixWorld)
  const aboveY = root.worldToLocal(boundsOf(root).max.clone()).y + 1

  const heights: number[] = []
  for (let i = 0; i * step <= maxRadius; i++) {
    const r = i * step
    const samples: number[] = []
    for (let a = 0; a < angles; a++) {
      const angle = (a / angles) * TAU
      const origin = root.localToWorld(new Vector3(Math.cos(angle) * r, aboveY, -Math.sin(angle) * r))
      raycaster.set(origin, down)
      const hit = raycaster.intersectObject(root, true)[0]
      if (hit) samples.push(root.worldToLocal(hit.point).y)
    }
    heights.push(samples.length > 0 ? median(samples) : (heights.at(-1) ?? 0))
  }

  return (radius) => {
    const x = Math.min(Math.max(radius / step, 0), heights.length - 1)
    const i = Math.floor(x)
    const a = heights[i]!
    const b = heights[Math.min(i + 1, heights.length - 1)]!
    return a + (b - a) * (x - i)
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}
