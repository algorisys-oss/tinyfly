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
  const dots = [...grid.querySelectorAll('.pg-dot')]
  live.set(dots, { scale: 1, opacity: 0.35 })

  // One tween per dot at a time: kill the previous one before starting the next,
  // so a fast-moving pointer never piles up tweens that fight each other.
  const tweens = new Map()
  const tweenDot = (dot, vars) => {
    tweens.get(dot)?.kill()
    tweens.set(dot, live.to(dot, vars))
  }

  const onMove = (event) => {
    dots.forEach((dot) => {
      const box = dot.getBoundingClientRect()
      const distance = Math.hypot(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2))
      const strength = Math.max(0, 1 - distance / 90)
      tweenDot(dot, { scale: 1 + strength * 1.8, opacity: 0.35 + strength * 0.65, duration: 0.3, ease: 'power2.out' })
    })
  }

  const onLeave = () => {
    dots.forEach((dot) => tweenDot(dot, { scale: 1, opacity: 0.35, duration: 0.6, ease: 'power3.out' }))
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
  description: 'Dots grow and brighten by distance to the pointer. Killing the previous tween per dot keeps it smooth.',
  tags: ['interaction', 'kill()', 'overwrite', 'hover'],
  html,
  run,
}
