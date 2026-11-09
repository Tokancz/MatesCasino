<script setup lang="ts">
import { pocketColor } from '@/game/wheel'
import { useRouletteStore } from '@/stores/roulette'

const roulette = useRouletteStore()
</script>

<template>
  <aside v-if="roulette.history.length" class="history panel" aria-label="Recent numbers">
    <span class="label">Last</span>
    <TransitionGroup tag="ol" name="history" class="history__list">
      <li
        v-for="(entry, i) in roulette.history"
        :key="entry.round"
        class="history__item"
        :class="[`is-${pocketColor(entry.number)}`, { 'is-latest': i === 0 }]"
      >
        {{ entry.number }}
      </li>
    </TransitionGroup>
  </aside>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  border-radius: var(--radius-lg);
}

.history__list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history__item {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  border: 1px solid rgb(255 255 255 / 0.15);
  font-variant-numeric: tabular-nums;
}

.history__item.is-latest {
  width: 42px;
  height: 42px;
  font-size: 17px;
  border: 2px solid var(--color-gold);
  box-shadow: var(--shadow-glow);
}

.is-red {
  background: var(--color-red);
}
.is-black {
  background: var(--color-black);
}
.is-green {
  background: var(--color-green);
}

.history-move,
.history-enter-active {
  transition: all var(--duration-slow) var(--ease-spring);
}
.history-leave-active {
  display: none;
}
.history-enter-from {
  opacity: 0;
  transform: scale(0.3);
}
</style>
