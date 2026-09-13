const cards = ['#4a9eff', '#9b59b6', '#ec4899', '#f59e0b', '#3ecf7a', '#14b8a6']
  .map((colour, i) => `<div class="ic-card" style="background: ${colour}">${i + 1}</div>`)
  .join('')

export const html = `<style>
  .ic-viewport { width: 240px; overflow: hidden; border-radius: 10px; }
  .ic-strip { display: flex; gap: 12px; width: max-content; padding: 10px 0; cursor: grab; touch-action: none; }
  .ic-card { width: 108px; height: 90px; border-radius: 10px; display: grid; place-items: center; color: #fff; font: 700 24px system-ui, sans-serif; flex-shrink: 0; }
  .ic-hint { margin-top: 8px; text-align: center; color: #555; font: 11px system-ui, sans-serif; }
</style>
<div>
  <div class="ic-viewport"><div class="ic-strip">${cards}</div></div>
  <div class="ic-hint">drag or flick the cards</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const viewport = root.querySelector('.ic-viewport')
  const strip = root.querySelector('.ic-strip')

  // One card plus its gap is one "page"; the strip can scroll until the last card shows.
  const step = 108 + 12
  const furthest = -(strip.scrollWidth - viewport.clientWidth)

  const carousel = live.draggable(strip, {
    type: 'x',
    bounds: { minX: furthest, maxX: 0 },
    // A flick coasts, then lands exactly on a card boundary.
    inertia: { end: { x: step }, friction: 3.5 },
  })

  // Nudge it on first view so it is obviously draggable.
  live.timeline().to(strip, { x: -step, duration: 0.6, ease: 'power2.inOut' }).to(strip, { x: 0, duration: 0.6, ease: 'power2.inOut' }, '+=0.2')
  // #endregion code

  return () => carousel.destroy()
}

/** @type {import('./types').LiveDemo} */
export const inertiaCarousel = {
  id: 'live-inertia-carousel',
  name: 'Inertia Carousel',
  description: 'A draggable strip that coasts after a flick and always settles on a card, never between two.',
  tags: ['draggable', 'inertia', 'snap', 'type: x'],
  html,
  run,
}
