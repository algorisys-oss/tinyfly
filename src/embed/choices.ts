import type { TinyflyPlayer } from '../player/player'

/**
 * Hotspots: parts of a figure the reader clicks to choose a scenario. "Click the
 * leader to take it down" is a `<g data-tinyfly-choose="leader-down">` inside the
 * SVG. Each one becomes a keyboard-reachable toggle button (Enter or Space), named
 * by its own `aria-label` or the scenario's label, and pressed while its scenario
 * shows.
 *
 * Works with or without the controls bar. Removing the hotspots puts back every
 * attribute this added.
 */

const STYLE_ID = 'tinyfly-choices-style'
const STYLES = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`

function ensureStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = STYLES
  doc.head.appendChild(style)
}

/** Wire every `[data-tinyfly-choose]` under `root` to the player's scenarios. Returns a function that unwires them. */
export function bindChoiceHotspots(player: TinyflyPlayer, root: Element): () => void {
  const hotspots = Array.from(root.querySelectorAll('[data-tinyfly-choose]'))
  if (hotspots.length === 0) return () => {}
  ensureStyles(root.ownerDocument)

  const added: Array<{ element: Element; attributes: string[] }> = []
  const listeners: Array<() => void> = []

  for (const element of hotspots) {
    const id = element.getAttribute('data-tinyfly-choose') ?? ''
    const attributes: string[] = []
    const set = (name: string, value: string) => {
      if (element.hasAttribute(name)) return
      element.setAttribute(name, value)
      attributes.push(name)
    }
    set('role', 'button')
    set('tabindex', '0')
    const label = player.scenarios.find((scenario) => scenario.id === id)?.label
    if (label !== undefined) set('aria-label', label)
    element.setAttribute('aria-pressed', 'false')
    attributes.push('aria-pressed')
    added.push({ element, attributes })

    const choose = () => player.setScenario(id)
    const onKey = (event: Event) => {
      const key = (event as KeyboardEvent).key
      if (key !== 'Enter' && key !== ' ') return
      // Handled here: the figure's own keys (Space plays) must not see it too.
      event.preventDefault()
      choose()
    }
    element.addEventListener('click', choose)
    element.addEventListener('keydown', onKey)
    listeners.push(() => {
      element.removeEventListener('click', choose)
      element.removeEventListener('keydown', onKey)
    })
  }

  const update = () => {
    for (const { element } of added) {
      element.setAttribute('aria-pressed', String(element.getAttribute('data-tinyfly-choose') === player.scenario))
    }
  }
  const unsubscribe = player.subscribe(update)
  update()

  return () => {
    unsubscribe()
    for (const remove of listeners) remove()
    for (const { element, attributes } of added) for (const name of attributes) element.removeAttribute(name)
  }
}
