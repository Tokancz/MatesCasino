import {
  CircleGeometry,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  PointLight,
  SpotLight,
  type Scene,
  type Vector3,
  type WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const BACKGROUND = new Color('#0b0709')

/**
 * Casino ambience: a dim warm room, a strong key light over the felt,
 * a focused spot on the wheel and a cool rim light for silhouettes.
 */
export function buildStage(scene: Scene, renderer: WebGLRenderer, tableCenter: Vector3, wheelCenter: Vector3): void {
  const pmrem = new PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.35
  pmrem.dispose()

  scene.background = BACKGROUND
  scene.fog = new FogExp2(BACKGROUND, 0.12)

  scene.add(new HemisphereLight('#ffe9cc', '#1a0f0a', 0.4))

  const key = new SpotLight('#ffe2b8', 40, 7, Math.PI / 4.5, 0.55, 1.6)
  key.position.set(tableCenter.x + 0.3, tableCenter.y + 2.4, tableCenter.z + 1.2)
  key.target.position.copy(tableCenter)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.bias = -0.0002
  key.shadow.normalBias = 0.02
  scene.add(key, key.target)

  const wheelSpot = new SpotLight('#fff3dd', 18, 4, Math.PI / 9, 0.6, 1.4)
  wheelSpot.position.set(wheelCenter.x + 0.2, wheelCenter.y + 1.8, wheelCenter.z + 0.4)
  wheelSpot.target.position.copy(wheelCenter)
  wheelSpot.castShadow = true
  wheelSpot.shadow.mapSize.set(1024, 1024)
  wheelSpot.shadow.bias = -0.0002
  scene.add(wheelSpot, wheelSpot.target)

  const rim = new DirectionalLight('#9bb7ff', 0.6)
  rim.position.set(-3, 2, -3)
  scene.add(rim)

  // Warm practical lights hinting at the room around the table.
  const lamps: [number, number][] = [
    [-3, -3],
    [3, -3],
    [0, 3.5],
  ]
  for (const [x, z] of lamps) {
    const lamp = new PointLight('#ff9d4d', 6, 6, 2)
    lamp.position.set(x, 2.2, z)
    scene.add(lamp)
  }

  const floor = new Mesh(new CircleGeometry(12, 64), new MeshStandardMaterial({ color: '#2a0d12', roughness: 0.95 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)
}
