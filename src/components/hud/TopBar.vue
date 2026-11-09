<script setup lang="ts">
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue'
import { useRouletteStore } from '@/stores/roulette'
import { useWalletStore } from '@/stores/wallet'

defineEmits<{ openCashier: [] }>()

const wallet = useWalletStore()
const roulette = useRouletteStore()
</script>

<template>
  <header class="top-bar">
    <h1 class="brand">Mates <span>Casino</span></h1>

    <div class="balances panel">
      <div class="balance">
        <span class="label">Cash</span>
        <AnimatedNumber :value="wallet.cash" />
      </div>
      <div class="balance">
        <span class="label">Chips</span>
        <AnimatedNumber :value="wallet.chipsInHand" />
      </div>
      <div class="balance">
        <span class="label">On table</span>
        <AnimatedNumber :value="wallet.stakedValue" :duration="0.3" />
      </div>
      <button class="btn btn--gold" type="button" :disabled="!roulette.isBetting" @click="$emit('openCashier')">
        Cashier
      </button>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  position: absolute;
  inset: var(--hud-gap) var(--hud-gap) auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--hud-gap);
  pointer-events: none;
}

.top-bar > * {
  pointer-events: auto;
}

.brand {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(20px, 2.4vw, 30px);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: var(--gradient-gold);
  background-size: 200% 100%;
  background-clip: text;
  color: transparent;
  animation: shimmer 6s linear infinite;
  filter: drop-shadow(0 2px 8px rgb(0 0 0 / 0.6));
}

.brand span {
  font-weight: 600;
}

.balances {
  display: flex;
  align-items: center;
  gap: clamp(12px, 2vw, 28px);
  padding: 8px 8px 8px 20px;
  border-radius: 999px;
}

.balance {
  display: grid;
  font-weight: 700;
}

@media (max-width: 720px) {
  .brand {
    display: none;
  }
  .balances {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
