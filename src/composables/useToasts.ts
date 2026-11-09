import { readonly, ref } from 'vue'

export interface Toast {
  id: number
  message: string
}

const DURATION_MS = 2600
const toasts = ref<Toast[]>([])
let nextId = 0

/** App-wide transient notifications. */
export function useToasts() {
  function notify(message: string): void {
    // Repeated clicks shouldn't stack the same message.
    if (toasts.value.some((t) => t.message === message)) return
    const id = nextId++
    toasts.value.push({ id, message })
    setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), DURATION_MS)
  }

  return { toasts: readonly(toasts), notify }
}
