import { createSignal } from 'solid-js'

/**
 * A persisted boolean "collapsed" flag for a sidebar panel section. Remembers
 * the state in localStorage under `key` so the user's chosen layout survives
 * reloads.
 */
export function createCollapsed(key: string, initial = false) {
  let start = initial
  try {
    const stored = localStorage.getItem(key)
    if (stored !== null) start = stored === '1'
  } catch {
    /* ignore */
  }
  const [collapsed, setCollapsed] = createSignal(start)
  const toggle = () => {
    const next = !collapsed()
    setCollapsed(next)
    try {
      localStorage.setItem(key, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }
  return [collapsed, toggle] as const
}
