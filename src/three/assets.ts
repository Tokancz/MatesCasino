import {
  Box3,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  Vector3,
  type Material,
  type Mesh,
  type Object3D,
} from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

const loader = new FBXLoader()

/** Loads an FBX. Resolves to null (and warns) when the file is missing or invalid. */
export async function loadModel(url: string): Promise<Object3D | null> {
  try {
    const model = await loader.loadAsync(url)
    prepareModel(model)
    return model
  } catch (error) {
    console.warn(`[assets] Could not load ${url} — using a placeholder.`, error)
    return null
  }
}

/** Loads many models in parallel, reporting progress 0..1. */
export async function loadModels<K extends string>(
  urls: Record<K, string>,
  onProgress: (progress: number) => void,
): Promise<Record<K, Object3D | null>> {
  const entries = Object.entries(urls) as [K, string][]
  let done = 0
  onProgress(0)
  const loaded = await Promise.all(
    entries.map(async ([key, url]) => {
      const model = await loadModel(url)
      onProgress(++done / entries.length)
      return [key, model] as const
    }),
  )
  return Object.fromEntries(loaded) as Record<K, Object3D | null>
}

/** Shadows on, and FBX Phong/Lambert materials upgraded to PBR so they react to the environment map. */
function prepareModel(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(toStandard) : toStandard(mesh.material)
  })
}

function toStandard(material: Material): Material {
  if (!(material instanceof MeshPhongMaterial || material instanceof MeshLambertMaterial)) return material
  const shininess = material instanceof MeshPhongMaterial ? material.shininess : 0
  const standard = new MeshStandardMaterial({
    name: material.name,
    color: material.color,
    map: material.map,
    normalMap: material instanceof MeshPhongMaterial ? material.normalMap : null,
    // Blender exports emissive white at intensity 0, so the intensity must come along.
    emissive: material.emissive,
    emissiveIntensity: material.emissiveIntensity,
    emissiveMap: material.emissiveMap,
    alphaMap: material.alphaMap,
    transparent: material.transparent,
    opacity: material.opacity,
    side: material.side,
    vertexColors: material.vertexColors,
    roughness: 1 - Math.min(shininess / 100, 1) * 0.75,
    metalness: 0,
  })
  material.dispose()
  return standard
}

/** World-space bounding box of an object. */
export const boundsOf = (obj: Object3D): Box3 => new Box3().setFromObject(obj)

/**
 * Scales `reference` so its largest horizontal extent equals `size`, centres its footprint on
 * the origin and rests it on y = 0. `parts` (which must share the reference's coordinate frame,
 * e.g. the two halves of the wheel exported from one scene) receive the exact same transform.
 */
export function fitAndGround(reference: Object3D, size: number, parts: Object3D[] = [reference]): void {
  reference.updateMatrixWorld(true)
  const extent = boundsOf(reference).getSize(new Vector3())
  const scale = size / Math.max(extent.x, extent.z, Number.EPSILON)
  for (const part of parts) {
    part.scale.multiplyScalar(scale)
    part.position.multiplyScalar(scale)
    part.updateMatrixWorld(true)
  }

  const box = boundsOf(reference)
  const center = box.getCenter(new Vector3())
  const offset = new Vector3(-center.x, -box.min.y, -center.z)
  for (const part of parts) {
    part.position.add(offset)
    part.updateMatrixWorld(true)
  }
}

/** Logs model sizes to help with calibrating `src/config/scene.ts`. */
export function describeModel(name: string, obj: Object3D): void {
  const size = boundsOf(obj).getSize(new Vector3())
  console.info(`[assets] ${name}: ${size.x.toFixed(3)} × ${size.y.toFixed(3)} × ${size.z.toFixed(3)} m`)
}
