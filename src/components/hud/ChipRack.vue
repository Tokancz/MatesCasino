<script setup lang="ts">
import CasinoChip from '@/components/ui/CasinoChip.vue'
import { CHIP_STYLES } from '@/config/game'
import { DENOMINATIONS } from '@/game/chips'
import { useRouletteStore } from '@/stores/roulette'
import { useWalletStore } from '@/stores/wallet'

const roulette = useRouletteStore()
const wallet = useWalletStore()
</script>

<template>
  <div class="rack panel" role="radiogroup" aria-label="Chip value">
    <button
      v-for="(d, i) in DENOMINATIONS"
      :key="d"
      type="button"
      role="radio"
      class="rack__chip"
      :class="{ 'is-selected': roulette.selectedChip === d, 'is-empty': wallet.chips[d] === 0 }"
      :aria-checked="roulette.selectedChip === d"
      :title="`${CHIP_STYLES[d].label} chip · key ${i + 1}`"
      @click="roulette.selectChip(d)"
    >
      <CasinoChip :denomination="d" />
      <span class="rack__count">×{{ wallet.chips[d] }}</span>
    </button>
  </div>
</template>

<style scoped>
.rack {
  display: flex;
  gap: 6px;
  padding: 10px 14px 8px;
  border-radius: var(--radius-lg);
}

.rack__chip {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  transition: transform var(--duration-base) var(--ease-spring);
}

.rack__chip:hover {
  transform: translateY(-4px);
}

.rack__chip.is-selected {
  transform: translateY(-10px);
}

.rack__chip.is-selected :deep(.chip) {
  animation: pulse-glow 1.8s var(--ease-out) infinite;
}

.rack__chip.is-empty {
  opacity: 0.45;
}

.rack__count {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-dim);
  font-variant-numeric: tabular-nums;
}

.is-selected .rack__count {
  color: var(--color-gold);
}
</style>
