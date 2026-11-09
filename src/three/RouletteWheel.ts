import { Group, Mesh, MeshStandardMaterial, SphereGeometry, Vector3, type Object3D } from 'three'
import { SPIN, WHEEL } from '@/config/scene'
import { type RadialProfile, sampleRadialProfile } from './radialProfile'
import { ballTravel, easeInOutSine, easeOutCubic, pocketAngle, progressBetween } from './wheelMath'

/** Portion of the spin used to lift the ball from its old pocket up onto the track. */
const LAUNCH_END = 0.05
const BOUNCES = 5
const BOUNCE_HEIGHT = 0.018

interface SpinState {
  elapsed: number
  from: number
  travel: number
  resolve: () => void
}

/**
 * Stationary base + spinning top + ball.
 *
 * The ball is parented to the spinning top and animated in its local frame, so whatever the
 * wheel does, the ball ends exactly in the chosen pocket: its relative angle eases from the
 * current pocket to the target one over `SPIN.duration`. Its height follows the wheel's sampled
 * surface, so it rolls along the track, over the slope and down into the pocket without clipping.
 */
export class RouletteWheel {
  readonly root = new Group()
  private readonly spinner = new Group()
  private readonly ball: Mesh
  private readonly surfaceHeight: RadialProfile

  private wheelSpeed = SPIN.idleWheelSpeed
  private ballAngle = pocketAngle(0)
  private spin: SpinState | null = null

  constructor(base: Object3D, top: Object3D) {
    this.root.name = 'roulette-wheel'
    this.spinner.add(top)
    this.root.add(base, this.spinner)
    this.surfaceHeight = sampleRadialProfile(this.root, WHEEL.ballTrackRadius + 0.02)

    this.ball = new Mesh(
      new SphereGeometry(WHEEL.ballRadius, 24, 16),
      new MeshStandardMaterial({ color: '#f7f7f2', roughness: 0.15, metalness: 0.1 }),
    )
    this.ball.castShadow = true
    this.spinner.add(this.ball)
    this.placeBall(WHEEL.pocketRadius)
  }

  /** 0 before a spin, 0..1 during, 1 once the ball rests. */
  get progress(): number {
    return this.spin ? Math.min(this.spin.elapsed / SPIN.duration, 1) : 1
  }

  get isSpinning(): boolean {
    return this.spin !== null
  }

  /** Launches the ball; resolves once it has settled in `result`'s pocket. */
  start(result: number): Promise<void> {
    this.spin?.resolve()
    this.wheelSpeed = SPIN.wheelSpeed
    return new Promise((resolve) => {
      this.spin = {
        elapsed: 0,
        from: this.ballAngle,
        travel: ballTravel(this.ballAngle, pocketAngle(result), SPIN.ballLaps),
        resolve,
      }
    })
  }

  update(dt: number): void {
    // The wheel slowly coasts back to its idle speed.
    this.wheelSpeed += (SPIN.idleWheelSpeed - this.wheelSpeed) * (1 - Math.exp(-0.12 * dt))
    this.spinner.rotation.y += this.wheelSpeed * dt

    if (!this.spin) return
    const spin = this.spin
    spin.elapsed += dt
    const t = this.progress

    this.ballAngle = spin.from + spin.travel * easeOutCubic(t)

    const { ballTrackRadius: track, pocketRadius: pocket } = WHEEL
    const launch = easeOutCubic(progressBetween(t, 0, LAUNCH_END))
    const drop = progressBetween(t, SPIN.dropStart, SPIN.dropEnd)
    const bounce = Math.abs(Math.sin(drop * Math.PI * BOUNCES)) * BOUNCE_HEIGHT * (1 - drop) ** 1.5

    const launchedRadius = pocket + (track - pocket) * launch
    this.placeBall(launchedRadius + (pocket - launchedRadius) * easeInOutSine(drop), bounce)

    if (t >= 1) {
      this.spin = null
      spin.resolve()
    }
  }

  ballWorldPosition(target = new Vector3()): Vector3 {
    return this.ball.getWorldPosition(target)
  }

  centerWorldPosition(target = new Vector3()): Vector3 {
    return this.root.getWorldPosition(target)
  }

  /** Puts the ball on the wheel surface at `radius`, optionally lifted by `lift`. */
  private placeBall(radius: number, lift = 0): void {
    const a = this.ballAngle
    const y = this.surfaceHeight(radius) + WHEEL.ballRadius + lift
    this.ball.position.set(Math.cos(a) * radius, y, -Math.sin(a) * radius)
  }
}
