import { onBeforeUnmount, onMounted } from 'vue'

type Handler = (event: KeyboardEvent) => void

/**
 * Global keyboard shortcuts. Keys are matched against `event.code` (e.g. "Space", "Digit1"),
 * prefixed with "Mod+" when Ctrl/Cmd is held. Ignored while typing in form fields.
 */
export function useHotkeys(bindings: Record<string, Handler>): void {
  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
    const key = (event.ctrlKey || event.metaKey ? 'Mod+' : '') + event.code
    const handler = bindings[key]
    if (!handler || event.repeat) return
    event.preventDefault()
    handler(event)
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
}
