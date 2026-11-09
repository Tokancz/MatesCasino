import { type ShallowRef, watch } from 'vue'
import { useRouletteStore } from '@/stores/roulette'
import type { CasinoScene } from '@/three/CasinoScene'

/** Connects the round state machine to the 3D scene and plays a full round. */
export function useRound(scene: ShallowRef<CasinoScene | null>) {
  const roulette = useRouletteStore()

  watch([scene, () => roulette.bets], ([s, bets]) => s?.syncBets(bets), { immediate: true })

  watch(
    [scene, () => roulette.isBetting],
    ([s, betting]) => {
      if (s) s.interactive = betting
    },
    { immediate: true },
  )

  async function spin(): Promise<void> {
    const s = scene.value
    if (!s || !roulette.canSpin) return
    const result = roulette.startSpin()
    if (result === null) return

    await s.playSpin(result)
    const round = roulette.settle()
    if (round) await s.playOutcome(result, round.winningSpotIds)
    roulette.nextRound()
  }

  return { spin }
}
