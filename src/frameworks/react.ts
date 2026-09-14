import { useCallback, useEffect, useLayoutEffect, useRef, type DependencyList, type RefObject } from 'react'
import { live as sharedLive, type LiveApi, type LiveContext } from '../compat/gsap'

/**
 * `tinyfly/react`: run `live` animations in a component, cleaned up for you
 * (like `@gsap/react`'s `useGSAP`).
 *
 *     function Hero() {
 *       const root = useRef(null)
 *       const { contextSafe } = useTinyfly((live) => {
 *         live.from('.title', { y: 40, opacity: 0 })   // selectors match inside root
 *       }, { scope: root })
 *       const pop = contextSafe(() => live.to('.cta', { scale: 1.1, yoyo: true, repeat: 1 }))
 *       return <section ref={root}><h1 className="title">Hi</h1><button className="cta" onClick={pop}>Go</button></section>
 *     }
 *
 * Everything the setup creates — tweens, timelines, scroll triggers and pins,
 * split text, draggables, smooth scrolling — is reverted when the component
 * unmounts, and before the setup runs again when `dependencies` change. Work
 * started later (in an event handler) joins through `contextSafe`.
 */

export interface UseTinyflyOptions {
  /** Selectors in the setup resolve inside this element */
  scope?: RefObject<Element | null>
  /** Run the setup again when these change (default: once) */
  dependencies?: DependencyList
  /** The live API to use (default: the shared `live`) */
  live?: LiveApi
}

export interface UseTinyflyResult {
  /** The current context, once the setup has run */
  readonly context: LiveContext | undefined
  /** Wrap an event handler so what it creates is reverted with the component */
  contextSafe<F extends (...args: never[]) => unknown>(fn: F): F
}

// useLayoutEffect warns during server rendering; animations only run in the browser anyway.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useTinyfly(
  setup: (live: LiveApi, context: LiveContext) => void | (() => void),
  options: UseTinyflyOptions | DependencyList = {}
): UseTinyflyResult {
  const settings: UseTinyflyOptions = Array.isArray(options) ? { dependencies: options } : (options as UseTinyflyOptions)
  const api = settings.live ?? sharedLive
  const contextRef = useRef<LiveContext | undefined>(undefined)
  const setupRef = useRef(setup)
  setupRef.current = setup

  useIsomorphicLayoutEffect(() => {
    const context = api.context((ctx) => setupRef.current(api, ctx), settings.scope?.current ?? undefined)
    contextRef.current = context
    return () => {
      context.revert()
      if (contextRef.current === context) contextRef.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, settings.dependencies ?? [])

  const contextSafe = useCallback(
    <F extends (...args: never[]) => unknown>(fn: F): F =>
      ((...args: Parameters<F>) => {
        const context = contextRef.current
        if (!context) return fn(...args)
        let result: unknown
        context.add(() => {
          result = fn(...args)
        })
        return result
      }) as F,
    []
  )

  return {
    get context() {
      return contextRef.current
    },
    contextSafe,
  }
}
