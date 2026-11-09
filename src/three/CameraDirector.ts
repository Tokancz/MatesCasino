import { Vector3, type PerspectiveCamera } from 'three'

export interface CameraShot {
  position: Vector3
  target: Vector3
}

type ShotSource = (dt: number) => CameraShot

/**
 * Smoothly moves the camera towards a desired shot every frame.
 * A shot is either fixed (`cut`/`moveTo`) or computed per frame (`track`), and
 * critically damped smoothing makes any switch between them seamless.
 */
export class CameraDirector {
  enabled = true
  private readonly lookAt = new Vector3()
  private source: ShotSource
  private stiffness = 2.5

  constructor(
    private readonly camera: PerspectiveCamera,
    initial: CameraShot,
  ) {
    this.source = () => initial
    this.cut(initial)
  }

  /** Jump immediately. */
  cut(shot: CameraShot): void {
    this.source = () => shot
    this.camera.position.copy(shot.position)
    this.lookAt.copy(shot.target)
    this.camera.lookAt(this.lookAt)
  }

  /** Glide to a fixed shot; higher stiffness = faster. */
  moveTo(shot: CameraShot, stiffness = 2.5): void {
    this.source = () => shot
    this.stiffness = stiffness
  }

  /** Follow a shot that is recomputed every frame. */
  track(source: ShotSource, stiffness = 3): void {
    this.source = source
    this.stiffness = stiffness
  }

  update(dt: number): void {
    if (!this.enabled) return
    const shot = this.source(dt)
    const k = 1 - Math.exp(-this.stiffness * dt)
    this.camera.position.lerp(shot.position, k)
    this.lookAt.lerp(shot.target, k)
    this.camera.lookAt(this.lookAt)
  }
}
