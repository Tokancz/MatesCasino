<script setup lang="ts">
import { computed } from 'vue'
import { type BetSpot, PAYOUTS } from '@/game/bets'
import { useRouletteStore } from '@/stores/roulette'
import { formatMoney } from '@/utils/format'

const props = defineProps<{ spot: BetSpot | null; x: number; y: number }>()

const roulette = useRouletteStore()
const stake = computed(() => roulette.bets.find((b) => b.spot.id === props.spot?.id)?.amount ?? 0)
</script>

<template>
  <div v-if="spot" class="tooltip panel" :style="{ transform: `translate(${x + 18}px, ${y + 18}px)` }">
    <strong>{{ spot.label }}</strong>
    <span class="tooltip__odds">pays {{ PAYOUTS[spot.kind] }} : 1</span>
    <span v-if="stake" class="tooltip__stake">{{ formatMoney(stake) }}</span>
  </div>
</template>

<style scoped>
.tooltip {
  position: fixed;
  top: 0;
  left: 0;
  display: grid;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
}

.tooltip__odds {
  color: var(--color-gold);
}

.tooltip__stake {
  color: var(--color-text-dim);
}
</style>
