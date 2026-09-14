import { live as sharedLive, type LiveApi, type LiveContext } from '../compat/gsap'

/**
 * `tinyfly/svelte`: a Svelte action (no Svelte import needed).
 *
 *     <script>
 *       import { tinyfly } from '@algorisys/tinyfly/svelte'
 *       const intro = (live) => live.from('.title', { y: 40, opacity: 0 })
 *     </script>
 *     <section use:tinyfly={intro}><h1 class="title">Hi</h1></section>
 *
 * The setup runs with selectors scoped to the element. Everything it creates is
 * reverted when the element is removed, and before a new setup runs when the
 * action's parameter changes.
 */

export type TinyflySetup = (live: LiveApi, context: LiveContext, node: Element) => void | (() => void)

export function tinyfly(node: Element, setup: TinyflySetup, api: LiveApi = sharedLive) {
  let context = api.context((ctx) => setup(api, ctx, node), node)
  return {
    update(next: TinyflySetup) {
      context.revert()
      context = api.context((ctx) => next(api, ctx, node), node)
    },
    destroy() {
      context.revert()
    },
  }
}
