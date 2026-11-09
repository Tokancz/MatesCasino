/**
 * Simple stand-ins used when a model in public/models is missing,
 * so the game stays playable and calibration has something to compare against.
 */
import {
  BoxGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector2,
  Vector3,
  type Box3,
  type Object3D,
} from 'three'
import { CHIP_STYLES } from '@/config/game'
import { CHIP, TABLE, WHEEL } from '@/config/scene'
import type { Denomination } from '@/game/chips'
import { WHEEL_SEQUENCE, pocketColor } from '@/game/wheel'
import { pocketAngle } from './wheelMath'

const wood = new MeshStandardMaterial({ color: '#4a2412', roughness: 0.55, side: DoubleSide })
const darkWood = new MeshStandardMaterial({ color: '#1c0f0a', roughness: 0.6 })
const felt = new MeshStandardMaterial({ color: '#0f5a34', roughness: 0.95 })
const brass = new MeshStandardMaterial({ color: '#d4a64a', metalness: 1, roughness: 0.3 })
const pocketMaterials = {
  red: new MeshStandardMaterial({ color: '#b3122e', roughness: 0.5 }),
  black: new MeshStandardMaterial({ color: '#141414', roughness: 0.5 }),
  green: new MeshStandardMaterial({ color: '#0f7a3c', roughness: 0.5 }),
}

function mesh(geometry: ConstructorParameters<typeof Mesh>[0], material: MeshStandardMaterial): Mesh {
  const m = new Mesh(geometry, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Felt slab beside the wheel, matching the real table's footprint (table space, metres). */
export function createTablePlaceholder(): Object3D {
  const slab = mesh(new BoxGeometry(1.15, 0.03, 1.5), felt)
  slab.position.set(0, 0.01, 1.18)
  return slab
}

/** Wooden cabinet filling the space between the floor and the underside of the table top. */
export function createTableCabinet(tableBounds: Box3): Object3D {
  const inset = 0.08
  const size = tableBounds.getSize(new Vector3())
  const center = tableBounds.getCenter(new Vector3())
  const height = TABLE.elevation + tableBounds.min.y
  const cabinet = mesh(new BoxGeometry(size.x - inset * 2, height, size.z - inset * 2), darkWood)
  cabinet.position.set(center.x, tableBounds.min.y - height / 2, center.z)
  return cabinet
}

/** Approximation of the real wheel: bowl with ball track, sloped rotor and pocket ring. */
export function createWheelPlaceholder(): { base: Object3D; top: Object3D } {
  const trackHeight = 0.034
  const rotorRadius = WHEEL.pocketRadius + 0.06

  const profile = [
    [0.38, -0.002],
    [0.4, 0.04],
    [WHEEL.ballTrackRadius + 0.02, 0.04],
    [WHEEL.ballTrackRadius, trackHeight],
    [rotorRadius + 0.005, 0.02],
    [rotorRadius + 0.005, -0.002],
  ].map(([r, y]) => new Vector2(r, y))
  const base = mesh(new LatheGeometry(profile, 96), wood)

  const top = new Group()
  const rotor = mesh(new CylinderGeometry(rotorRadius, rotorRadius, 0.01, 64), wood)
  rotor.position.y = -0.005
  const turret = mesh(new ConeGeometry(0.06, 0.15, 32), brass)
  turret.position.y = 0.075
  top.add(rotor, turret)

  const tangential = ((2 * Math.PI * WHEEL.pocketRadius) / WHEEL_SEQUENCE.length) * 0.92
  WHEEL_SEQUENCE.forEach((n) => {
    const angle = pocketAngle(n)
    const tile = mesh(new BoxGeometry(0.04, 0.003, tangential), pocketMaterials[pocketColor(n)])
    tile.position.set(Math.cos(angle) * WHEEL.pocketRadius, 0.0015, -Math.sin(angle) * WHEEL.pocketRadius)
    tile.rotation.y = angle
    top.add(tile)
  })

  return { base, top }
}

export function createChipPlaceholder(denomination: Denomination): Object3D {
  const style = CHIP_STYLES[denomination]
  const r = CHIP.diameter / 2
  const h = CHIP.fallbackThickness
  const group = new Group()

  const body = mesh(
    new CylinderGeometry(r, r, h, 32),
    new MeshStandardMaterial({ color: style.color, roughness: 0.45 }),
  )
  body.position.y = h / 2
  const inlay = new Mesh(
    new CircleGeometry(r * 0.62, 32),
    new MeshStandardMaterial({ color: style.accent, roughness: 0.6 }),
  )
  inlay.rotation.x = -Math.PI / 2
  inlay.position.y = h + 0.0002
  group.add(body, inlay)
  return group
}
