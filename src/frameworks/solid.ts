import { onCleanup, onMount } from 'solid-js'
import { live as sharedLive, type LiveApi, type LiveContext } from '../compat/gsap'

/**
 * `tinyfly/solid`: run `live` animations in a component, cleaned up for you.
 *
 *     let root!: HTMLElement
 *     createTinyfly((live) => live.from('.title', { y: 40, opacity: 0 }), () => root)
 *     return <section ref={root}><h1 class="title">Hi</h1></section>
 *
 * The setup runs on mount, scoped to the element `scope` returns. Everything it
 * creates is reverted when the owner is cleaned up.
 */
export function createTinyfly(
  setup: (live: LiveApi, context: LiveContext) => void | (() => void),
  scope?: () => Element | undefined,
  api: LiveApi = sharedLive
) {
  let context: LiveContext | undefined
  onMount(() => {
    context = api.context((ctx) => setup(api, ctx), scope?.())
  })
  onCleanup(() => {
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
