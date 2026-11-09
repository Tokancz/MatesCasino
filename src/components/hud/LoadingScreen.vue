<script setup lang="ts">
defineProps<{ progress: number; error: string | null }>()
</script>

<template>
  <div class="loading">
    <h1 class="loading__title">Mates Casino</h1>
    <p v-if="error" class="loading__error">{{ error }}</p>
    <template v-else>
      <div
        class="loading__bar"
        role="progressbar"
        :aria-valuenow="Math.round(progress * 100)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="loading__fill" :style="{ transform: `scaleX(${progress})` }" />
      </div>
      <span class="label">Preparing the table…</span>
    </template>
  </div>
</template>

<style scoped>
.loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 18px;
  background: radial-gradient(ellipse at center, #2a0f16 0%, var(--color-bg) 70%);
  z-index: 20;
}

.loading__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(32px, 6vw, 64px);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: var(--gradient-gold);
  background-size: 200% 100%;
  background-clip: text;
  color: transparent;
  animation: shimmer 3s linear infinite;
}

.loading__bar {
  width: min(320px, 70vw);
  height: 4px;
  border-radius: 2px;
  background: rgb(255 255 255 / 0.08);
  overflow: hidden;
}

.loading__fill {
  height: 100%;
  background: var(--gradient-gold);
  transform-origin: left;
  transition: transform var(--duration-base) var(--ease-out);
}

.loading__error {
  color: var(--color-danger);
}
</style>
