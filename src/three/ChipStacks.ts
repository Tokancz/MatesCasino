import gsap from 'gsap'
import { Group, Vector3, type Object3D } from 'three'
import { CHIP } from '@/config/scene'
import type { Bet } from '@/game/bets'
import { type Denomination, breakdown } from '@/game/chips'

export type ChipFactory = (denomination: Denomination) => Object3D

interface Stack {
  group: Group
  amount: number
}

const DROP_HEIGHT = 0.06

/**
 * Renders one chip stack per bet, in the betting surface's local frame.
 * Stacks show the bet amount with the fewest chips (largest at the bottom).
 */
export class ChipStacks {
  readonly root = new Group()
  private readonly stacks = new Map<string, Stack>()

  constructor(
    private readonly createChip: ChipFactory,
    private readonly chipThickness: number,
    private readonly toLocal: (u: number, v: number) => Vector3,
  ) {
    this.root.name = 'chip-stacks'
  }

  sync(bets: readonly Bet[]): void {
    const live = new Set<string>()
    for (const { spot, amount } of bets) {
      live.add(spot.id)
      const existing = this.stacks.get(spot.id)
      if (existing?.amount === amount) continue

      const group = existing?.group ?? this.createStackGroup(spot.anchor.u, spot.anchor.v)
      const grew = amount > (existing?.amount ?? 0)
      this.fillStack(group, amount)
      this.stacks.set(spot.id, { group, amount })
      if (grew) this.animateDrop(group)
    }

    for (const [id, stack] of this.stacks) {
      if (!live.has(id)) this.remove(id, stack)
    }
  }

  /** Slides losing stacks towards `collectPoint` (local frame) and removes them. */
  async sweepLosers(winners: ReadonlySet<string>, collectPoint: Vector3): Promise<void> {
    const losers = [...this.stacks].filter(([id]) => !winners.has(id))
    await Promise.all(
      losers.map(([id, stack], i) =>
        gsap
          .timeline({ delay: i * 0.05, onComplete: () => this.remove(id, stack) })
          .to(stack.group.position, { x: collectPoint.x, z: collectPoint.z, duration: 0.9, ease: 'power2.in' }, 0)
          .to(stack.group.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.4, ease: 'power1.in' }, 0.5)
          .then(),
      ),
    )
  }

  /** Hops winning stacks up and down. */
  async celebrateWinners(winners: ReadonlySet<string>): Promise<void> {
    const groups = [...this.stacks].filter(([id]) => winners.has(id)).map(([, s]) => s.group)
    if (groups.length === 0) return
    await gsap
      .to(
        groups.map((g) => g.position),
        { y: 0.03, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 5, stagger: 0.04 },
      )
      .then()
  }

  /** World positions just above the given stacks, for effects. */
  stackTops(ids: Iterable<string>): Vector3[] {
    return [...ids].flatMap((id) => {
      const stack = this.stacks.get(id)
      if (!stack) return []
      const top = new Vector3(0, stack.group.children.length * this.chipThickness, 0)
      return [stack.group.localToWorld(top)]
    })
  }

  clear(): void {
    for (const [id, stack] of this.stacks) this.remove(id, stack)
  }

  private createStackGroup(u: number, v: number): Group {
    const group = new Group()
    group.position.copy(this.toLocal(u, v))
    this.root.add(group)
    return group
  }

  private fillStack(group: Group, amount: number): void {
    group.clear()
    const chips = breakdown(amount).chips.slice(0, CHIP.maxStack)
    chips.forEach((denomination, i) => {
      const chip = this.createChip(denomination)
      // Deterministic jitter so stacks look hand-placed without flickering on rebuild.
      chip.position.set(Math.sin(i * 12.9) * 0.0007, i * this.chipThickness, Math.cos(i * 7.3) * 0.0007)
      chip.rotation.y = i * 1.7
      group.add(chip)
    })
  }

  private animateDrop(group: Group): void {
    const top = group.children.at(-1)
    if (!top) return
    gsap.from(top.position, { y: top.position.y + DROP_HEIGHT, duration: 0.35, ease: 'bounce.out' })
  }

  private remove(id: string, stack: Stack): void {
    gsap.killTweensOf([stack.group.position, stack.group.scale])
    stack.group.removeFromParent()
    this.stacks.delete(id)
  }
}
