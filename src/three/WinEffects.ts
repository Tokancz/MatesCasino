import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  PointLight,
  Points,
  PointsMaterial,
  type Texture,
  type Vector3,
} from 'three'

const PALETTE = ['#ffd36b', '#fff4d1', '#f2a93b', '#ff5468'].map((c) => new Color(c))
const GRAVITY = 1.6
const DRAG = 1.4

interface Burst {
  points: Points<BufferGeometry, PointsMaterial>
  velocities: Float32Array
  age: number
  life: number
}

/** Golden spark bursts with a short light flash. */
export class WinEffects {
  readonly root = new Group()
  private readonly bursts: Burst[] = []
  private readonly sprite = createSparkTexture()
  private readonly flash = new PointLight('#ffcf70', 0, 1.5, 2)

  constructor() {
    this.root.add(this.flash)
  }

  burst(origin: Vector3, count = 180, power = 1): void {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      origin.toArray(positions, i * 3)
      PALETTE[i % PALETTE.length]!.toArray(colors, i * 3)
      // Upward cone with random spread.
      const angle = Math.random() * Math.PI * 2
      const spread = Math.random() * 0.9 * power
      const lift = (0.9 + Math.random() * 1.4) * power
      velocities.set([Math.cos(angle) * spread, lift, Math.sin(angle) * spread], i * 3)
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
    const material = new PointsMaterial({
      size: 0.012,
      map: this.sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })

    const points = new Points(geometry, material)
    points.frustumCulled = false
    this.root.add(points)
    this.bursts.push({ points, velocities, age: 0, life: 2 + Math.random() * 0.4 })

    this.flash.position.copy(origin).setY(origin.y + 0.3)
    this.flash.intensity = 0.8 * power
  }

  update(dt: number): void {
    this.flash.intensity *= Math.exp(-4 * dt)

    for (let b = this.bursts.length - 1; b >= 0; b--) {
      const burst = this.bursts[b]!
      burst.age += dt
      const position = burst.points.geometry.getAttribute('position') as BufferAttribute
      const p = position.array as Float32Array
      const v = burst.velocities
      const drag = Math.exp(-DRAG * dt)

      for (let i = 0; i < v.length; i += 3) {
        v[i]! *= drag
        v[i + 1] = v[i + 1]! * drag - GRAVITY * dt
        v[i + 2]! *= drag
        p[i]! += v[i]! * dt
        p[i + 1]! += v[i + 1]! * dt
        p[i + 2]! += v[i + 2]! * dt
      }
      position.needsUpdate = true
      burst.points.material.opacity = 1 - burst.age / burst.life

      if (burst.age >= burst.life) {
        burst.points.removeFromParent()
        burst.points.geometry.dispose()
        burst.points.material.dispose()
        this.bursts.splice(b, 1)
      }
    }
  }

  dispose(): void {
    for (const burst of this.bursts) {
      burst.points.geometry.dispose()
      burst.points.material.dispose()
    }
    this.sprite.dispose()
  }
}

function createSparkTexture(): Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,240,200,0.8)')
  gradient.addColorStop(1, 'rgba(255,200,100,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}
