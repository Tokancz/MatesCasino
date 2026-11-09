<script setup lang="ts">
import { useToasts } from '@/composables/useToasts'

const { toasts } = useToasts()
</script>

<template>
  <TransitionGroup tag="ul" name="rise" class="toasts" aria-live="assertive">
    <li v-for="toast in toasts" :key="toast.id" class="toast panel">{{ toast.message }}</li>
  </TransitionGroup>
</template>

<style scoped>
.toasts {
  position: absolute;
  bottom: 140px;
  left: 50%;
  translate: -50% 0;
  display: grid;
  justify-items: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  pointer-events: none;
}

.toast {
  padding: 10px 18px;
  border-color: rgb(255 92 108 / 0.4);
  border-radius: 999px;
  font-weight: 500;
}
</style>
