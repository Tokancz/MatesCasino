<script setup lang="ts">
import { ref, shallowReactive, useTemplateRef } from 'vue'
import BetControls from '@/components/hud/BetControls.vue'
import BetTooltip from '@/components/hud/BetTooltip.vue'
import CashierDialog from '@/components/hud/CashierDialog.vue'
import ChipRack from '@/components/hud/ChipRack.vue'
import HistoryStrip from '@/components/hud/HistoryStrip.vue'
import LoadingScreen from '@/components/hud/LoadingScreen.vue'
import ResultBanner from '@/components/hud/ResultBanner.vue'
import ToastHost from '@/components/hud/ToastHost.vue'
import TopBar from '@/components/hud/TopBar.vue'
import { useCasinoScene } from '@/composables/useCasinoScene'
import { useHotkeys } from '@/composables/useHotkeys'
import { useRound } from '@/composables/useRound'
import { useToasts } from '@/composables/useToasts'
import { CHIP_STYLES } from '@/config/game'
import type { BetSpot } from '@/game/bets'
import { DENOMINATIONS } from '@/game/chips'
import { type BetError, useRouletteStore } from '@/stores/roulette'

const roulette = useRouletteStore()
const { notify } = useToasts()
const stage = useTemplateRef<HTMLElement>('stage')
const cashierOpen = ref(false)
const hover = shallowReactive<{ spot: BetSpot | null; x: number; y: number }>({ spot: null, x: 0, y: 0 })

function report(error: BetError | null): void {
  if (error === 'no-chips') notify(`Not enough ${CHIP_STYLES[roulette.selectedChip].label} chips — visit the cashier`)
  else if (error === 'nothing-to-repeat') notify('No previous bets to repeat')
}

const { scene, progress, error } = useCasinoScene(stage, {
  onHover: (spot, x, y) => Object.assign(hover, { spot, x, y }),
  onPlace: (spot) => report(roulette.placeChip(spot)),
  onRemove: (spot) => roulette.removeChip(spot.id),
})
const { spin } = useRound(scene)

const rebet = () => report(roulette.rebet())

/** Shortcuts are off while the cashier dialog has focus. */
const whenPlaying = (action: () => unknown) => () => {
  if (!cashierOpen.value) action()
}

useHotkeys({
  Space: whenPlaying(spin),
  KeyR: whenPlaying(rebet),
  'Mod+KeyZ': whenPlaying(roulette.undo),
  ...Object.fromEntries(DENOMINATIONS.map((d, i) => [`Digit${i + 1}`, whenPlaying(() => roulette.selectChip(d))])),
})
</script>

<template>
  <main class="casino">
    <div ref="stage" class="casino__stage" />

    <div class="casino__hud">
      <TopBar @open-cashier="cashierOpen = true" />
      <HistoryStrip class="casino__history" />
      <ResultBanner />
      <ToastHost />

      <div class="casino__dock">
        <ChipRack />
        <BetControls @spin="spin" @rebet="rebet" />
      </div>

      <p class="casino__hint label">Click to bet · Right-click to remove · Space to spin</p>
    </div>

    <BetTooltip v-bind="hover" />
    <CashierDialog v-model:open="cashierOpen" />

    <Transition name="fade">
      <LoadingScreen v-if="!scene" :progress="progress" :error="error" />
    </Transition>
  </main>
</template>

<style scoped>
.casino {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.casino__stage {
  position: absolute;
  inset: 0;
}

.casino__hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.casino__hud > :deep(*) {
  pointer-events: auto;
}

.casino__history {
  position: absolute;
  top: 96px;
  left: var(--hud-gap);
}

.casino__dock {
  position: absolute;
  right: var(--hud-gap);
  bottom: calc(var(--hud-gap) + 22px);
  left: var(--hud-gap);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--hud-gap);
  pointer-events: none;
}

.casino__dock > * {
  pointer-events: auto;
}

.casino__hint {
  position: absolute;
  bottom: 8px;
  width: 100%;
  margin: 0;
  text-align: center;
  opacity: 0.6;
  pointer-events: none;
}
</style>
