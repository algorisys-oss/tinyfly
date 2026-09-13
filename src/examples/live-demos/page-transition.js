export const html = `<style>
  .pt-app { width: 260px; height: 200px; overflow: hidden; border-radius: 10px; background: #111; color: #eee; font: 13px system-ui, sans-serif; }
  .pt-page { height: 100%; padding: 12px; box-sizing: border-box; }
  .pt-page h3 { margin: 0 0 10px; font-size: 14px; }
  .pt-row { display: flex; align-items: center; gap: 10px; padding: 6px; border-radius: 8px; cursor: pointer; }
  .pt-row:hover { background: #1c1c1f; }
  .pt-thumb { width: 44px; height: 32px; border-radius: 6px; flex: none; }
  .pt-hero { height: 110px; border-radius: 10px; margin-bottom: 10px; }
  .pt-back { background: none; border: 0; color: #9aa; padding: 0; font: inherit; cursor: pointer; margin-bottom: 8px; }
</style>
<div class="pt-app"></div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const places = [
    ['Lisbon', '#f59e0b', '#ef4444'],
    ['Oslo', '#4a9eff', '#10b981'],
    ['Kyoto', '#ec4899', '#8b5cf6'],
  ]

  // Two "routes" rendered into one container, as a client-side router would.
  const app = root.querySelector('.pt-app')
  const gradient = (a, b) => `linear-gradient(135deg, ${a}, ${b})`

  const listPage = () => `<div class="pt-page"><h3>Places</h3>${places
    .map(([name, a, b], i) => `<div class="pt-row" data-open="${i}"><div class="pt-thumb" data-flip-id="place-${i}" style="background:${gradient(a, b)}"></div>${name}</div>`)
    .join('')}</div>`

  const detailPage = (i) => {
    const [name, a, b] = places[i]
    return `<div class="pt-page"><button class="pt-back">← All places</button><div class="pt-hero" data-flip-id="place-${i}" style="background:${gradient(a, b)}"></div><h3>${name}</h3></div>`
  }

  let busy = false
  const go = async (render) => {
    if (busy) return
    busy = true
    // The old page fades out, the DOM is swapped, the image with the same
    // data-flip-id grows from where it was, and the new page fades in.
    await live.pageTransition({
      from: '.pt-page',
      to: '.pt-page',
      shared: '[data-flip-id]',
      duration: 0.3,
      update: () => (app.innerHTML = render()),
    })
    busy = false
  }

  app.innerHTML = listPage()
  app.addEventListener('click', (event) => {
    const row = event.target.closest('[data-open]')
    if (row) go(() => detailPage(Number(row.dataset.open)))
    else if (event.target.closest('.pt-back')) go(listPage)
  })
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const pageTransitionDemo = {
  id: 'live-page-transition',
  name: 'Page Transition',
  description: 'Click a place: the list page leaves, the route swaps, the thumbnail grows into the new page’s hero, and the page arrives — live.pageTransition.',
  tags: ['pageTransition', 'router', 'data-flip-id', 'shared element'],
  requiresLayout: true,
  html,
  run,
}
