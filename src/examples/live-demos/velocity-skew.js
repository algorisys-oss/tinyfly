const items = Array.from({ length: 12 }, (_, i) => `<div class="vs-item">Item ${i + 1}</div>`).join('')

export const html = `<style>
  .vs-scroller { width: 240px; height: 150px; overflow-y: auto; border-radius: 8px; background: #1b1b1b; }
  .vs-item { margin: 10px 14px; padding: 12px 14px; border-radius: 8px; background: linear-gradient(90deg, #4a9eff, #9b59b6); color: #fff; font: 600 13px system-ui, sans-serif; }
</style>
<div class="vs-scroller">${items}</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const scroller = root.querySelector('.vs-scroller')
  const items = scroller.querySelectorAll('.vs-item')
  let lastTop = scroller.scrollTop
  let lastTime = performance.now()
  let settle = null

  // Skew by how fast the list is scrolling, then ease back to flat.
  const onScroll = () => {
    const now = performance.now()
    const velocity = (scroller.scrollTop - lastTop) / Math.max(now - lastTime, 1)
    lastTop = scroller.scrollTop
    lastTime = now

    const skew = Math.max(-15, Math.min(15, velocity * -10))
    settle?.kill()
    settle = live.fromTo(items, { skewY: skew }, { skewY: 0, duration: 0.8, ease: 'power3.out' })
  }

  scroller.addEventListener('scroll', onScroll)
  // #endregion code

  return () => scroller.removeEventListener('scroll', onScroll)
}

/** @type {import('./types').LiveDemo} */
export const velocitySkew = {
  id: 'live-velocity-skew',
  name: 'Velocity Skew',
  description: 'Scroll the list: items skew with scroll speed and settle back when you stop.',
  tags: ['scroll', 'velocity', 'skewY', 'kill()'],
  html,
  run,
}
