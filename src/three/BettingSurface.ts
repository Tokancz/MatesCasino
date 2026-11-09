import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneGeometry,
  Vector3,
  type Ray,
} from 'three'
import { LAYOUT } from '@/config/scene'
import type { BetSpot } from '@/game/bets'
import { type Rect, numberCell, outsideRect, spotAt } from '@/game/layout'
import { ALL_NUMBERS } from '@/game/wheel'

/** Lift overlays above the felt to avoid z-fighting. */
const OVERLAY_LIFT = 0.0015

/** Physical depth of one layout row: number rows (v ≥ 0) and outside-bet rows (v < 0) differ. */
const rowDepth = (v: number): number => (v >= 0 ? LAYOUT.cellDepth : LAYOUT.outsideDepth)

/** Layout (u, v) → local x / z. Piecewise linear in v, since outside rows are narrower. */
const localX = (u: number): number => u * LAYOUT.cellWidth
const localZ = (v: number): number => -v * rowDepth(v)
const layoutV = (z: number): number => -z / rowDepth(-z)

/**
 * The betting grid in 3D: maps rays to bet spots, and draws hover / winner highlights.
 * Its local frame is the layout frame: x along u, −z along v, y = 0 on the felt.
 */
export class BettingSurface {
  readonly root = new Group()
  private readonly plane = new Plane()
  private readonly hoverMaterial = overlayMaterial('#ffe7a3', 0.22)
  private readonly winnerMaterial = overlayMaterial('#ffd36b', 0.5)
  private readonly numberHighlights = new Map<number, Mesh>()
  private readonly outsideHighlight: Mesh
  private readonly winnerHighlight: Mesh

  /** `surfaceY` is the felt height in the parent's (table) space. */
  constructor(surfaceY: number, showGrid: boolean) {
    this.root.name = 'betting-surface'
    this.root.position.set(LAYOUT.originX, surfaceY, LAYOUT.originZ)
    this.root.rotation.y = LAYOUT.rotationY

    for (const n of ALL_NUMBERS) {
      const quad = this.createQuad(numberCell(n), this.hoverMaterial)
      this.numberHighlights.set(n, quad)
    }
    this.outsideHighlight = this.createQuad({ u: 0, v: 0, width: 1, height: 1 }, this.hoverMaterial)
    this.winnerHighlight = this.createQuad({ u: 0, v: 0, width: 1, height: 1 }, this.winnerMaterial)

    if (showGrid) this.root.add(createGridLines())
  }

  /** Layout coordinates → position in the surface's local frame. */
  toLocal(u: number, v: number, target = new Vector3()): Vector3 {
    return target.set(localX(u), 0, localZ(v))
  }

  /** Layout coordinates (plus height above the felt) → world position. */
  toWorld(u: number, v: number, height = 0, target = new Vector3()): Vector3 {
    this.toLocal(u, v, target).y = height
    return this.root.localToWorld(target)
  }

  pick(ray: Ray): BetSpot | null {
    const up = new Vector3(0, 1, 0).transformDirection(this.root.matrixWorld)
    this.plane.setFromNormalAndCoplanarPoint(up, this.root.getWorldPosition(new Vector3()))
    const hit = ray.intersectPlane(this.plane, new Vector3())
    if (!hit) return null
    const local = this.root.worldToLocal(hit)
    return spotAt(local.x / LAYOUT.cellWidth, layoutV(local.z))
  }

  highlight(spot: BetSpot | null): void {
    const covered = new Set(spot?.numbers)
    for (const [n, quad] of this.numberHighlights) quad.visible = covered.has(n)

    const rect = spot && outsideRect(spot)
    this.outsideHighlight.visible = rect !== null
    if (rect) this.fitQuad(this.outsideHighlight, rect)
  }

  showWinner(n: number | null): void {
    this.winnerHighlight.visible = n !== null
    if (n !== null) this.fitQuad(this.winnerHighlight, numberCell(n))
  }

  update(elapsed: number): void {
    this.winnerMaterial.opacity = 0.3 + 0.25 * Math.sin(elapsed * 6)
  }

  private createQuad(rect: Rect, material: MeshBasicMaterial): Mesh {
    const quad = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), material)
    quad.visible = false
    quad.renderOrder = 1
    this.fitQuad(quad, rect)
    this.root.add(quad)
    return quad
  }

  private fitQuad(quad: Mesh, rect: Rect): void {
    this.toLocal(rect.u + rect.width / 2, rect.v + rect.height / 2, quad.position).y = OVERLAY_LIFT
    // Inset slightly so neighbouring highlights stay visually separate.
    quad.scale.set(rect.width * LAYOUT.cellWidth * 0.94, 1, rect.height * rowDepth(rect.v) * 0.94)
  }
}

function overlayMaterial(color: string, opacity: number): MeshBasicMaterial {
  return new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: AdditiveBlending })
}

/** Outline of the printed layout; shown in debug mode (for calibration) and on the placeholder table. */
function createGridLines(): LineSegments {
  const points: number[] = []
  const line = (u1: number, v1: number, u2: number, v2: number) => {
    points.push(localX(u1), OVERLAY_LIFT, localZ(v1), localX(u2), OVERLAY_LIFT, localZ(v2))
  }

  for (let v = 0; v <= 3; v++) line(v === 0 || v === 3 ? -1 : 0, v, 13, v)
  for (let u = -1; u <= 13; u++) line(u, 0, u, 3)
  line(0, -1, 12, -1)
  line(0, -2, 12, -2)
  // Even-money separators every 2 columns; those every 4 also split the dozens.
  for (let u = 0; u <= 12; u += 2) line(u, -2, u, u % 4 === 0 ? 0 : -1)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
  return new LineSegments(geometry, new LineBasicMaterial({ color: '#f3e6c4', transparent: true, opacity: 0.7 }))
}
