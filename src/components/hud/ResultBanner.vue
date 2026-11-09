<script setup lang="ts">
import { computed } from 'vue'
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import { pocketColor } from '@/game/wheel'
import { useRouletteStore } from '@/stores/roulette'

const roulette = useRouletteStore()

const round = computed(() => (roulette.phase === 'result' ? roulette.lastRound : null))
const profit = computed(() => (round.value ? round.value.payout - round.value.stake : 0))
</script>

<template>
  <Transition name="banner">
    <div v-if="round" class="banner" role="status" aria-live="polite">
      <div class="banner__number" :class="`is-${pocketColor(round.number)}`">{{ round.number }}</div>
      <div v-if="round.payout > 0" class="banner__text is-win">
        <span class="label">You win</span>
        <strong><AnimatedNumber :value="round.payout" :duration="1.4" /></strong>
        <small v-if="profit > 0">+{{ profit.toLocaleString('en-US') }} profit</small>
      </div>
      <div v-else class="banner__text">
        <span class="label">No win this time</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.banner {
  position: absolute;
  top: 18%;
  left: 50%;
  translate: -50% 0;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 28px 14px 14px;
  border-radius: 999px;
  background: var(--color-panel);
  border: 1px solid var(--color-panel-border);
  box-shadow: var(--shadow-panel);
  backdrop-filter: var(--blur-panel);
  pointer-events: none;
}

.banner__number {
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: 3px solid var(--color-gold);
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 800;
  box-shadow: var(--shadow-glow);
  animation: pop-in var(--duration-slow) var(--ease-out);
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

.banner__text {
  display: grid;
}

.banner__text strong {
  font-size: 30px;
  font-family: var(--font-display);
}

.banner__text.is-win strong {
  background: var(--gradient-gold);
  background-size: 200% 100%;
  background-clip: text;
  color: transparent;
  animation: shimmer 2s linear infinite;
}

.banner__text small {
  color: var(--color-text-dim);
}

.banner-enter-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-slow) var(--ease-spring);
}
.banner-leave-active {
  transition:
    opacity var(--duration-base),
    transform var(--duration-base);
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
</style>
