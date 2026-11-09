import { AxesHelper, Group, Raycaster, Vector2, Vector3, type Object3D } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CHIP, LAYOUT, MODELS, SPIN, TABLE } from '@/config/scene'
import type { Bet, BetSpot } from '@/game/bets'
import { DENOMINATIONS, type Denomination } from '@/game/chips'
import { wait } from '@/utils/wait'
import { boundsOf, describeModel, fitAndGround, loadModels } from './assets'
import { BettingSurface } from './BettingSurface'
import { type CameraShot, CameraDirector } from './CameraDirector'
import { ChipStacks } from './ChipStacks'
import { Engine } from './Engine'
import {
  createChipPlaceholder,
  createTableCabinet,
  createTablePlaceholder,
  createWheelPlaceholder,
} from './placeholders'
import { RouletteWheel } from './RouletteWheel'
import { buildStage } from './stage'
import { WinEffects } from './WinEffects'
import { easeInOutSine, progressBetween } from './wheelMath'

export interface SceneCallbacks {
  onHover(spot: BetSpot | null, clientX: number, clientY: number): void
  onPlace(spot: BetSpot): void
  onRemove(spot: BetSpot): void
}

export interface SceneOptions {
  debug: boolean
  onProgress(progress: number): void
}

/** Pointer travel (px) above which a press counts as a drag, not a click. */
const CLICK_TOLERANCE = 6

/** The whole 3D casino: builds the scene and exposes high-level, awaitable animations. */
export class CasinoScene {
  /** When false, the table ignores the pointer (e.g. while the ball is spinning). */
  interactive = true

  private readonly raycaster = new Raycaster()
  private readonly pointer = new Vector2()
  private readonly pressedAt = new Vector2()
  private readonly director: CameraDirector
  private readonly effects = new WinEffects()
  private readonly tableShot: CameraShot
  private readonly controls?: OrbitControls
  private hovered: BetSpot | null = null
  private orbitAngle = Math.PI / 2
  private disposed = false

  private constructor(
    private readonly engine: Engine,
    tableSpace: Group,
    private readonly wheel: RouletteWheel,
    private readonly surface: BettingSurface,
    private readonly chips: ChipStacks,
    private readonly callbacks: SceneCallbacks,
    debug: boolean,
  ) {
    const { scene, camera, canvas } = engine
    scene.add(tableSpace, this.effects.root)
    surface.root.add(chips.root)
    scene.updateMatrixWorld(true)

    this.tableShot = {
      position: surface.toWorld(4, -7.5, 0.95),
      target: surface.toWorld(4.5, 0.3),
    }
    const introShot = {
      position: surface.toWorld(2, -16, 1.6),
      target: surface.toWorld(2, 1),
    }
    this.director = new CameraDirector(camera, introShot)
    this.director.moveTo(this.tableShot, 1.2)

    if (debug) {
      this.director.enabled = false
      this.controls = new OrbitControls(camera, canvas)
      this.controls.target.copy(this.tableShot.target)
      this.controls.enableDamping = true
      scene.add(new AxesHelper(0.5))
    }

    engine.onFrame((dt, elapsed) => {
      this.wheel.update(dt)
      this.director.update(dt)
      this.controls?.update()
      this.surface.update(elapsed)
      this.effects.update(dt)
    })

    canvas.addEventListener('pointermove', this.handlePointerMove)
    canvas.addEventListener('pointerdown', this.handlePointerDown)
    canvas.addEventListener('pointerup', this.handlePointerUp)
    canvas.addEventListener('pointerleave', this.handlePointerLeave)
    canvas.addEventListener('contextmenu', this.handleContextMenu)
  }

  static async create(container: HTMLElement, callbacks: SceneCallbacks, options: SceneOptions): Promise<CasinoScene> {
    const engine = new Engine(container)
    const models = await loadModels(
      {
        table: MODELS.table,
        wheelBase: MODELS.wheelBase,
        wheelTop: MODELS.wheelTop,
        ...Object.fromEntries(DENOMINATIONS.map((d) => [`chip${d}`, MODELS.chips[d]])),
      } as Record<'table' | 'wheelBase' | 'wheelTop' | `chip${Denomination}`, string>,
      options.onProgress,
    )

    // Table space: the shared Blender scene in metres, origin at the wheel centre.
    // Everything is measured while it still sits at the world origin, then raised onto the cabinet.
    const tableSpace = new Group()
    tableSpace.name = 'table-space'

    for (const model of [models.table, models.wheelBase, models.wheelTop]) {
      model?.scale.multiplyScalar(TABLE.unitScale)
      model?.position.multiplyScalar(TABLE.unitScale)
    }

    const table = models.table ?? createTablePlaceholder()
    tableSpace.add(table)
    const tableBounds = boundsOf(table)
    tableSpace.add(createTableCabinet(tableBounds))

    const wheel = createWheel(models.wheelBase, models.wheelTop)
    tableSpace.add(wheel.root)

    const surface = new BettingSurface(feltHeight(table), options.debug || !models.table)
    tableSpace.add(surface.root)
    tableSpace.position.y = TABLE.elevation

    const { factory, thickness } = createChipFactory(models)
    const chips = new ChipStacks(factory, thickness, (u, v) => surface.toLocal(u, v))

    buildStage(engine.scene, engine.renderer, surface.toWorld(5.5, 0.5), wheel.centerWorldPosition())

    if (options.debug) {
      for (const [name, model] of Object.entries(models)) if (model) describeModel(name, model)
    }

    return new CasinoScene(engine, tableSpace, wheel, surface, chips, callbacks, options.debug)
  }

  syncBets(bets: readonly Bet[]): void {
    this.chips.sync(bets)
  }

  /** Camera flies to the wheel, the ball spins and the camera chases it until it lands. */
  async playSpin(result: number): Promise<void> {
    this.setHover(null)
    const center = this.wheel.centerWorldPosition()
    const toCamera = this.engine.camera.position.clone().sub(center)
    this.orbitAngle = Math.atan2(toCamera.z, toCamera.x)

    this.director.track((dt) => this.spinShot(dt, center), 2.4)
    await this.wheel.start(result)
    await wait(700)
  }

  /** Celebrate (or not), return to the table, highlight the number and settle the chips. */
  async playOutcome(result: number, winningSpotIds: readonly string[]): Promise<void> {
    const winners = new Set(winningSpotIds)
    if (winners.size > 0) this.effects.burst(this.wheel.ballWorldPosition(), 220, 0.8)
    await wait(winners.size > 0 ? 1500 : 900)

    this.director.moveTo(this.tableShot, 2.2)
    this.surface.showWinner(result)
    await wait(900)

    const dealer = this.surface.root.worldToLocal(this.wheel.centerWorldPosition())
    for (const top of this.chips.stackTops(winners)) this.effects.burst(top, 70, 0.45)
    await Promise.all([this.chips.sweepLosers(winners, dealer), this.chips.celebrateWinners(winners)])
    await wait(600)

    this.surface.showWinner(null)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    const { canvas } = this.engine
    canvas.removeEventListener('pointermove', this.handlePointerMove)
    canvas.removeEventListener('pointerdown', this.handlePointerDown)
    canvas.removeEventListener('pointerup', this.handlePointerUp)
    canvas.removeEventListener('pointerleave', this.handlePointerLeave)
    canvas.removeEventListener('contextmenu', this.handleContextMenu)
    this.controls?.dispose()
    this.effects.dispose()
    this.engine.dispose()
  }

  /**
   * Spin camera: orbits the wheel while the ball is fast, then swings round to sit behind the
   * ball and closes in as it slows, ending in a close-up of the pocket.
   */
  private spinShot(dt: number, center: Vector3): CameraShot {
    const ball = this.wheel.ballWorldPosition()
    const chase = easeInOutSine(progressBetween(this.wheel.progress, SPIN.chaseStart, 1))

    const ballAngle = Math.atan2(ball.z - center.z, ball.x - center.x)
    const behindBall = shortestArc(ballAngle - this.orbitAngle)
    this.orbitAngle += 0.3 * dt * (1 - chase) + behindBall * (1 - Math.exp(-4 * chase * dt))

    const distance = lerp(0.85, 0.48, chase)
    const height = lerp(0.75, 0.28, chase)
    const position = new Vector3(
      center.x + Math.cos(this.orbitAngle) * distance,
      center.y + height,
      center.z + Math.sin(this.orbitAngle) * distance,
    )
    const target = center
      .clone()
      .setY(center.y + 0.03)
      .lerp(ball, chase)
    return { position, target }
  }

  private setHover(spot: BetSpot | null, clientX = 0, clientY = 0): void {
    if (spot?.id !== this.hovered?.id) this.surface.highlight(spot)
    this.hovered = spot
    this.engine.canvas.style.cursor = spot ? 'pointer' : ''
    this.callbacks.onHover(spot, clientX, clientY)
  }

  private pick(event: PointerEvent | MouseEvent): BetSpot | null {
    if (!this.interactive) return null
    const rect = this.engine.canvas.getBoundingClientRect()
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.engine.camera)
    return this.surface.pick(this.raycaster.ray)
  }

  private readonly handlePointerMove = (event: PointerEvent) => {
    this.setHover(this.pick(event), event.clientX, event.clientY)
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    this.pressedAt.set(event.clientX, event.clientY)
  }

  private readonly handlePointerUp = (event: PointerEvent) => {
    if (event.button !== 0) return
    if (this.pressedAt.distanceTo(new Vector2(event.clientX, event.clientY)) > CLICK_TOLERANCE) return
    const spot = this.pick(event)
    if (spot) this.callbacks.onPlace(spot)
  }

  private readonly handlePointerLeave = () => this.setHover(null)

  private readonly handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
    const spot = this.pick(event)
    if (spot) this.callbacks.onRemove(spot)
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const shortestArc = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle))

/** Height of the felt under the betting grid, ray-cast straight down onto the table (at the origin). */
function feltHeight(table: Object3D): number {
  table.updateMatrixWorld(true)
  const { originX, originZ, cellWidth, cellDepth, rotationY } = LAYOUT
  // Middle of the number grid: u = 6, v = 1.5 rotated into table space.
  const u = 6 * cellWidth
  const v = 1.5 * cellDepth
  const x = originX + u * Math.cos(rotationY) - v * Math.sin(rotationY)
  const z = originZ - u * Math.sin(rotationY) - v * Math.cos(rotationY)
  const raycaster = new Raycaster(new Vector3(x, boundsOf(table).max.y + 1, z), new Vector3(0, -1, 0))
  return raycaster.intersectObject(table, true)[0]?.point.y ?? boundsOf(table).max.y
}

function createWheel(base: Object3D | null, top: Object3D | null): RouletteWheel {
  if (base && top) return new RouletteWheel(base, top)
  if (base || top) console.warn('[scene] Both wheel parts are required — using the placeholder wheel.')
  const placeholder = createWheelPlaceholder()
  return new RouletteWheel(placeholder.base, placeholder.top)
}

function createChipFactory(models: Partial<Record<`chip${Denomination}`, Object3D | null>>) {
  const templates = new Map<Denomination, Object3D>()
  let thickness = CHIP.fallbackThickness

  for (const d of DENOMINATIONS) {
    const model = models[`chip${d}`]
    if (model) {
      fitAndGround(model, CHIP.diameter)
      const wrapper = new Group().add(model)
      thickness = boundsOf(wrapper).getSize(new Vector3()).y
      templates.set(d, wrapper)
    } else {
      templates.set(d, createChipPlaceholder(d))
    }
  }

  return { factory: (d: Denomination) => templates.get(d)!.clone(), thickness }
}
