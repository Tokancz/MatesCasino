<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import CasinoChip from '@/components/ui/CasinoChip.vue'
import { DENOMINATIONS } from '@/game/chips'
import { useWalletStore } from '@/stores/wallet'
import { formatMoney } from '@/utils/format'

const open = defineModel<boolean>('open', { required: true })
const wallet = useWalletStore()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

// Native <dialog> gives us focus trapping, Esc to close and an accessible modal for free.
watch(open, (isOpen) => (isOpen ? dialog.value?.showModal() : dialog.value?.close()))

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) open.value = false
}
</script>

<template>
  <dialog ref="dialog" class="cashier" aria-labelledby="cashier-title" @close="open = false" @click="onBackdropClick">
    <div class="cashier__card panel">
      <header class="cashier__header">
        <h2 id="cashier-title">Cashier</h2>
        <button class="btn cashier__close" type="button" aria-label="Close" @click="open = false">✕</button>
      </header>

      <p class="cashier__cash">
        <span class="label">Cash available</span>
        <strong>{{ formatMoney(wallet.cash) }}</strong>
      </p>

      <ul class="cashier__rows">
        <li v-for="d in DENOMINATIONS" :key="d" class="cashier__row">
          <CasinoChip :denomination="d" :size="44" />
          <div class="cashier__owned">
            <strong>× {{ wallet.chips[d] }}</strong>
            <span class="label">{{ formatMoney(d * wallet.chips[d]) }}</span>
          </div>
          <div class="cashier__actions">
            <button class="btn" type="button" :disabled="wallet.chips[d] < 1" @click="wallet.sellChips(d, 1)">
              Sell
            </button>
            <button class="btn" type="button" :disabled="wallet.cash < d" @click="wallet.buyChips(d, 1)">Buy 1</button>
            <button class="btn" type="button" :disabled="wallet.cash < d * 10" @click="wallet.buyChips(d, 10)">
              Buy 10
            </button>
          </div>
        </li>
      </ul>

      <footer class="cashier__footer">
        <button class="btn" type="button" :disabled="wallet.chipsInHand === 0" @click="wallet.cashOutAll()">
          Cash out all chips
        </button>
        <button v-if="wallet.isBroke" class="btn btn--gold" type="button" @click="wallet.reset()">
          Reset bankroll
        </button>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.cashier {
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  max-width: min(560px, calc(100vw - 32px));
  width: 100%;
}

.cashier::backdrop {
  background: rgb(5 3 4 / 0.6);
  backdrop-filter: blur(4px);
}

.cashier[open] .cashier__card {
  animation: pop-in var(--duration-slow) var(--ease-out);
}

.cashier__card {
  padding: 22px 24px;
  background: var(--color-panel-solid);
  border-radius: var(--radius-lg);
}

.cashier__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cashier__header h2 {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  color: var(--color-gold);
}

.cashier__close {
  width: 36px;
  height: 36px;
  padding: 0;
}

.cashier__cash {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 18px 0 12px;
  font-size: 18px;
}

.cashier__rows {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cashier__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  background: rgb(255 255 255 / 0.03);
}

.cashier__owned {
  display: grid;
  flex: 1;
}

.cashier__actions {
  display: flex;
  gap: 6px;
}

.cashier__actions .btn {
  padding: 7px 12px;
  font-size: 13px;
}

.cashier__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
</style>
