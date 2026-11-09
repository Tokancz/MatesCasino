<script setup lang="ts">
import gsap from 'gsap'
import { onBeforeUnmount, reactive, watch } from 'vue'
import { formatMoney } from '@/utils/format'

const props = withDefaults(defineProps<{ value: number; duration?: number }>(), { duration: 0.8 })

const display = reactive({ value: props.value })

watch(
  () => props.value,
  (value) => gsap.to(display, { value, duration: props.duration, ease: 'power2.out', overwrite: true }),
)

onBeforeUnmount(() => gsap.killTweensOf(display))
</script>

<template>
  <span class="animated-number">{{ formatMoney(Math.round(display.value)) }}</span>
</template>

<style scoped>
.animated-number {
  font-variant-numeric: tabular-nums;
}
</style>
