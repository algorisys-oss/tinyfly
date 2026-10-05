const words = ['Timelines', 'Tracks', 'Keyframes', 'Easing', 'Springs', 'Stagger', 'JSON']
const pills = words.map((word) => `<span class="mq-pill">${word}</span>`).join('')

export const html = `<style>
  .mq-viewport { width: 260px; overflow: hidden; padding: 8px 0; -webkit-mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent); mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent); }
  .mq-row { display: flex; gap: 10px; width: max-content; }
  .mq-pill { padding: 8px 14px; border-radius: 999px; background: #262626; border: 1px solid #333; color: #ddd; font: 13px system-ui, sans-serif; white-space: nowrap; }
  .mq-hint { margin-top: 14px; color: #555; font: 11px system-ui, sans-serif; text-align: center; }
</style>
<div>
  <div class="mq-viewport"><div class="mq-row">${pills}${pills}</div></div>
  <div class="mq-hint">hover the strip to slow it down</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const viewport = root.querySelector('.mq-viewport')
  const row = viewport.querySelector('.mq-row')

  // The row holds the items twice. Moving it left by exactly one copy (half its
  // width, plus the gap between the copies) and repeating makes a seamless loop.
  const gap = 10
  const distance = (row.scrollWidth + gap) / 2
  const loop = live.fromTo(row, { x: 0 }, { x: -distance, duration: 9, ease: 'none', repeat: -1 })

  const slow = () => loop.timeScale(0.2)
  const normal = () => loop.timeScale(1)
  viewport.addEventListener('pointerenter', slow)
  viewport.addEventListener('pointerleave', normal)
  // #endregion code

  return () => {
    viewport.removeEventListener('pointerenter', slow)
    viewport.removeEventListener('pointerleave', normal)
  }
}

/** @type {import('./types').LiveDemo} */
export const infiniteMarquee = {
  id: 'live-infinite-marquee',
  name: 'Infinite Marquee',
  description: 'A seamless looping strip with repeat: -1, slowed with timeScale() while hovered.',
  tags: ['repeat: -1', 'ease: none', 'timeScale', 'loop'],
  html,
  run,
}
