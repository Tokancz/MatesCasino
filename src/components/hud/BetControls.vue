<script setup lang="ts">
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import { useRouletteStore } from '@/stores/roulette'

defineEmits<{ spin: []; rebet: [] }>()

const roulette = useRouletteStore()

const PHASE_TEXT = {
  betting: 'Place your bets',
  spinning: 'No more bets',
  result: 'Paying out',
} as const
</script>

<template>
  <div class="controls panel">
    <div class="controls__status">
      <span class="label">{{ PHASE_TEXT[roulette.phase] }}</span>
      <strong class="controls__total"><AnimatedNumber :value="roulette.totalStake" :duration="0.3" /></strong>
    </div>

    <div class="controls__actions">
      <button
        class="btn"
        type="button"
        :disabled="!roulette.isBetting || roulette.totalStake === 0"
        title="Undo · Ctrl+Z"
        @click="roulette.undo()"
      >
        Undo
      </button>
      <button
        class="btn"
        type="button"
        :disabled="!roulette.isBetting || roulette.totalStake === 0"
        @click="roulette.clearBets()"
      >
        Clear
      </button>
      <button
        class="btn"
        type="button"
        :disabled="!roulette.isBetting || !roulette.hasPreviousBets"
        title="Repeat last bets · R"
        @click="$emit('rebet')"
      >
        Rebet
      </button>
    </div>

    <button
      class="spin btn btn--gold"
      :class="{ 'is-ready': roulette.canSpin }"
      type="button"
      :disabled="!roulette.canSpin"
      title="Spin · Space"
      @click="$emit('spin')"
    >
      Spin
    </button>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 10px 10px 20px;
  border-radius: var(--radius-lg);
}

.controls__status {
  display: grid;
  min-width: 130px;
}

.controls__total {
  font-size: 20px;
}

.controls__actions {
  display: flex;
  gap: 6px;
}

.spin {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  font-family: var(--font-display);
  font-size: 20px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.spin.is-ready {
  animation:
    pulse-glow 1.6s var(--ease-out) infinite,
    float 3s ease-in-out infinite;
}

@media (max-width: 720px) {
  .controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  .spin {
    width: 72px;
    height: 72px;
    font-size: 16px;
  }
}
</style>
