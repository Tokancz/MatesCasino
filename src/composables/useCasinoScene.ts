import { type Ref, type ShallowRef, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { CasinoScene, type SceneCallbacks } from '@/three/CasinoScene'

const isDebug = () => new URLSearchParams(window.location.search).has('debug')

/** Mounts the 3D casino into `container` for the lifetime of the calling component. */
export function useCasinoScene(
  container: Readonly<Ref<HTMLElement | null>>,
  callbacks: SceneCallbacks,
): { scene: ShallowRef<CasinoScene | null>; progress: Ref<number>; error: Ref<string | null> } {
  const scene = shallowRef<CasinoScene | null>(null)
  const progress = ref(0)
  const error = ref<string | null>(null)
  let unmounted = false

  onMounted(async () => {
    if (!container.value) return
    try {
      const created = await CasinoScene.create(container.value, callbacks, {
        debug: isDebug(),
        onProgress: (p) => (progress.value = p),
      })
      if (unmounted) created.dispose()
      else scene.value = created
    } catch (e) {
      console.error(e)
      error.value = 'Your browser could not start the 3D table (WebGL is required).'
    }
  })

  onBeforeUnmount(() => {
    unmounted = true
    scene.value?.dispose()
  })

  return { scene, progress, error }
}
