import { mountAll } from './mount'

/**
 * Mount every `[data-tinyfly-embed]` when the page is ready, if the script that
 * is running now was loaded with `data-tinyfly-auto`. Call it at the top level of
 * a bundle's entry: `document.currentScript` is only set while a classic script
 * first runs.
 */
export function autoMountFromCurrentScript(): void {
  const script = typeof document !== 'undefined' ? (document.currentScript as HTMLScriptElement | null) : null
  if (!script?.hasAttribute('data-tinyfly-auto')) return
  const start = () => void mountAll()
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
}
