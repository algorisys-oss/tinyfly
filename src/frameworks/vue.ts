import { onBeforeUnmount, onMounted, watch, type Ref, type WatchSource } from 'vue'
import { live as sharedLive, type LiveApi, type LiveContext } from '../compat/gsap'

/**
 * `tinyfly/vue`: run `live` animations in a component, cleaned up for you.
 *
 *     const root = ref(null)
 *     const { contextSafe } = useTinyfly((live) => {
 *       live.from('.title', { y: 40, opacity: 0 })
 *     }, { scope: root })
 *
 * The setup runs when the component mounts, inside a `live.context` scoped to
 * `scope`. Everything it creates is reverted before the component unmounts, and
 * before the setup runs again when a `watch` source changes.
 */

export interface UseTinyflyOptions {
  /** Selectors in the setup resolve inside this element */
  scope?: Ref<Element | null | undefined>
  /** Run the setup again when these change */
  watch?: WatchSource[]
  /** The live API to use (default: the shared `live`) */
  live?: LiveApi
}

export function useTinyfly(setup: (live: LiveApi, context: LiveContext) => void | (() => void), options: UseTinyflyOptions = {}) {
  const api = options.live ?? sharedLive
  let context: LiveContext | undefined

  const run = () => {
    context?.revert()
    context = api.context((ctx) => setup(api, ctx), options.scope?.value ?? undefined)
  }

  onMounted(run)
  if (options.watch?.length) watch(options.watch, run)
  onBeforeUnmount(() => {
    context?.revert()
    context = undefined
  })

  return {
    get context() {
      return context
    },
    /** Wrap an event handler so what it creates is reverted with the component */
    contextSafe<F extends (...args: never[]) => unknown>(fn: F): F {
      return ((...args: Parameters<F>) => {
        if (!context) return fn(...args)
        let result: unknown
        context.add(() => {
          result = fn(...args)
        })
        return result
      }) as F
    },
  }
}
