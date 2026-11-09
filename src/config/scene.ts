/**
 * Everything needed to line the 3D models up with the game logic.
 * All distances are in metres, world Y is up, the player looks towards −Z.
 *
 * Calibrate with `?debug` in the URL: free orbit camera, axes and the betting-grid overlay.
 */
import type { Denomination } from '@/game/chips'

const asset = (path: string) => `${import.meta.env.BASE_URL}models/${path}`

export const MODELS = {
  table: asset('Table.fbx'),
  wheelBase: asset('WheelBottom.fbx'),
  wheelTop: asset('WheelTop.fbx'),
  chips: {
    1000: asset('chips/1kChip.fbx'),
    5000: asset('chips/5kChip.fbx'),
    25000: asset('chips/25kChip.fbx'),
    100000: asset('chips/100kChip.fbx'),
  } satisfies Record<Denomination, string>,
}

/**
 * The table and wheel come from one Blender scene and keep its coordinates:
 * the origin is the centre of the wheel, the table runs along +Z and the player sits on the −X side.
 */
export const TABLE = {
  /** Metres per model unit (Blender FBX export is in centimetres). */
  unitScale: 0.01,
  /** Height of the scene origin above the floor — the table model is only the top slab. */
  elevation: 0.75,
}

/** Placement of the printed betting grid in table space; see the diagram in src/game/layout.ts. */
export const LAYOUT = {
  /** X/Z of layout point (u=0, v=0): corner of the "1" cell nearest the zero and the player. */
  originX: -0.1087,
  originZ: 0.547,
  /** One number cell: along the table (u) and across it (v). */
  cellWidth: 0.0897,
  cellDepth: 0.1336,
  /** Depth of each outside-bet row (dozens, even-money), which are narrower than number rows. */
  outsideDepth: 0.104,
  /** Turns the layout so u runs along +Z and v points away from the player (+X). */
  rotationY: -Math.PI / 2,
}

export const WHEEL = {
  /** Radius (m) of the groove along the rim where the ball circles. */
  ballTrackRadius: 0.36,
  /** Radius (m) of the centre of the number pockets. */
  pocketRadius: 0.243,
  ballRadius: 0.009,
  /** Angle (radians, around +Y) of the centre of the 0 pocket on the spinning top; π/2 = towards −Z. */
  zeroAngle: Math.PI / 2,
  /** Whether the numbers run clockwise when viewed from above. */
  clockwise: true,
}

export const CHIP = {
  diameter: 0.04,
  /** Used by the placeholder chip; real thickness comes from the model. */
  fallbackThickness: 0.0035,
  /** Tallest stack drawn on a single spot. */
  maxStack: 20,
}

export const SPIN = {
  /** Seconds from launch until the ball rests in its pocket. */
  duration: 9,
  /** Full laps of the ball relative to the wheel. */
  ballLaps: 10,
  /** Angular speed of the wheel top (rad/s) right after launch, and while idle. */
  wheelSpeed: 1.3,
  idleWheelSpeed: 0.25,
  /** Portion of the spin (0..1) during which the ball falls from the track into the pockets. */
  dropStart: 0.62,
  dropEnd: 0.86,
  /** Progress at which the camera stops orbiting and starts chasing the ball. */
  chaseStart: 0.66,
}
