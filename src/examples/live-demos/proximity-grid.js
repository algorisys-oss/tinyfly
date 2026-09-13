const dots = Array.from({ length: 60 }, () => '<div class="pg-dot"></div>').join('')

export const html = `<style>
  .pg-grid { display: grid; grid-template-columns: repeat(10, 12px); gap: 12px; padding: 14px; border-radius: 8px; background: #1b1b1b; }
  .pg-dot { width: 12px; height: 12px; border-radius: 50%; background: #4a9eff; opacity: 0.35; }
</style>
<div class="pg-grid">${dots}</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const grid = root.querySelector('.pg-grid')
  const dots = [...grid.querySelectorAll('.pg-dot')].map((element) => ({
    element,
    // One reusable tween per dot and property: a fast pointer re-targets them
    // rather than piling up tweens that fight each other.
    scale: live.quickTo(element, 'scale', { duration: 0.3, ease: 'power2.out' }),
    opacity: live.quickTo(element, 'opacity', { duration: 0.3, ease: 'power2.out' }),
  }))
  live.set(dots.map((dot) => dot.element), { scale: 1, opacity: 0.35 })

  const onMove = (event) => {
    dots.forEach((dot) => {
      const box = dot.element.getBoundingClientRect()
      const distance = Math.hypot(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2))
      const strength = Math.max(0, 1 - distance / 90)
      dot.scale(1 + strength * 1.8)
      dot.opacity(0.35 + strength * 0.65)
    })
  }

  const onLeave = () => {
    dots.forEach((dot) => {
      dot.scale(1)
      dot.opacity(0.35)
    })
  }

  grid.addEventListener('pointermove', onMove)
  grid.addEventListener('pointerleave', onLeave)
  // #endregion code

  return () => {
    grid.removeEventListener('pointermove', onMove)
    grid.removeEventListener('pointerleave', onLeave)
  }
}

/** @type {import('./types').LiveDemo} */
export const proximityGrid = {
  id: 'live-proximity-grid',
  name: 'Proximity Grid',
  description: 'Dots grow and brighten by distance to the pointer, each through quickTo setters that re-target instead of piling up tweens.',
  tags: ['interaction', 'quickTo', 'hover'],
  html,
  run,
}
