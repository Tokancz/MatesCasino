<script setup lang="ts">
import { computed } from 'vue'
import { CHIP_STYLES } from '@/config/game'
import type { Denomination } from '@/game/chips'

const props = withDefaults(defineProps<{ denomination: Denomination; size?: number }>(), { size: 56 })

const style = computed(() => {
  const chip = CHIP_STYLES[props.denomination]
  return { '--chip-color': chip.color, '--chip-accent': chip.accent, '--chip-size': `${props.size}px` }
})
</script>

<template>
  <span class="chip" :style="style" aria-hidden="true">
    <span class="chip__face">{{ CHIP_STYLES[denomination].label }}</span>
  </span>
</template>

<style scoped>
.chip {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: var(--chip-size);
  height: var(--chip-size);
  border-radius: 50%;
  /* Edge stripes */
  background: repeating-conic-gradient(var(--chip-accent) 0deg 15deg, var(--chip-color) 15deg 45deg), var(--chip-color);
  box-shadow:
    0 4px 10px rgb(0 0 0 / 0.5),
    inset 0 0 0 2px rgb(0 0 0 / 0.25);
}

.chip__face {
  display: grid;
  place-items: center;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--chip-color) 70%, white), var(--chip-color));
  border: 2px dashed var(--chip-accent);
  color: var(--color-gold);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: calc(var(--chip-size) * 0.22);
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.6);
}
</style>
