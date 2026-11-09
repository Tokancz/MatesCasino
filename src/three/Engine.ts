import {
  ACESFilmicToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Timer,
  WebGLRenderer,
  type Material,
  type Mesh,
} from 'three'

export type FrameCallback = (dt: number, elapsed: number) => void

/** Owns the renderer, scene, camera and the render loop. */
export class Engine {
  readonly renderer: WebGLRenderer
  readonly scene = new Scene()
  readonly camera = new PerspectiveCamera(45, 1, 0.01, 60)

  private readonly timer = new Timer()
  private readonly callbacks = new Set<FrameCallback>()
  private readonly resizeObserver: ResizeObserver

  constructor(private readonly container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.95
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFShadowMap
    container.appendChild(this.renderer.domElement)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.timer.connect(document)
    this.renderer.setAnimationLoop((time) => this.frame(time))
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  onFrame(callback: FrameCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.container
    if (w === 0 || h === 0) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private frame(time: number): void {
    this.timer.update(time)
    // Clamp so a long hitch doesn't produce one giant step.
    const dt = Math.min(this.timer.getDelta(), 1 / 20)
    const elapsed = this.timer.getElapsed()
    for (const cb of this.callbacks) cb(dt, elapsed)
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null)
    this.timer.dispose()
    this.resizeObserver.disconnect()
    this.callbacks.clear()
    this.scene.traverse((obj) => {
      const mesh = obj as Mesh
      if (!mesh.isMesh) return
      mesh.geometry.dispose()
      const materials: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((m) => m.dispose())
    })
    this.scene.environment?.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
