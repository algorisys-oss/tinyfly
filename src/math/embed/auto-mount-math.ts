import { mountAllMath } from './mount-math'

/**
 * Mount every `[data-tinyfly-math]` figure when the page is ready, if the
 * script running now was loaded with `data-tinyfly-auto`. Call it at the top
 * level of a bundle's entry: `document.currentScript` is only set while a
 * classic script first runs.
 */
export function autoMountMathFromCurrentScript(): void {
  const script = typeof document !== 'undefined' ? (document.currentScript as HTMLScriptElement | null) : null
  if (!script?.hasAttribute('data-tinyfly-auto')) return
  const start = () => void mountAllMath()
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
}
