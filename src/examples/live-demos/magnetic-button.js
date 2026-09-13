export const html = `<style>
  .mb-area { width: 260px; height: 150px; display: grid; place-items: center; }
  .mb-button { padding: 14px 28px; border: none; border-radius: 999px; background: linear-gradient(135deg, #4a9eff, #9b59b6); color: #fff; font: 600 14px system-ui, sans-serif; cursor: pointer; }
  .mb-label { display: inline-block; pointer-events: none; }
</style>
<div class="mb-area">
  <button class="mb-button"><span class="mb-label">Hover me</span></button>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const area = root.querySelector('.mb-area')
  const button = area.querySelector('.mb-button')
  const label = button.querySelector('.mb-label')

  // quickTo makes one reusable tween per property: every pointer move re-targets
  // it from where the value is now, instead of starting a new tween each time.
  const pull = { duration: 0.4, ease: 'power3.out' }
  const buttonX = live.quickTo(button, 'x', pull)
  const buttonY = live.quickTo(button, 'y', pull)
  const labelX = live.quickTo(label, 'x', pull)
  const labelY = live.quickTo(label, 'y', pull)

  // Pull the button (and, less, its label) toward the pointer. Measured from the
  // area's centre, which does not move, so the pull does not feed back on itself.
  const onMove = (event) => {
    const box = area.getBoundingClientRect()
    const dx = event.clientX - (box.left + box.width / 2)
    const dy = event.clientY - (box.top + box.height / 2)
    buttonX(dx * 0.35)
    buttonY(dy * 0.35)
    labelX(dx * 0.15)
    labelY(dy * 0.15)
  }

  // Snap back with an elastic ease. Played last, so it wins over the pull.
  const onLeave = () => {
    live
      .timeline({ bakeEases: true })
      .to(button, { x: 0, y: 0, duration: 1, ease: 'elastic.out' })
      .to(label, { x: 0, y: 0, duration: 1, ease: 'elastic.out' }, '<')
  }

  area.addEventListener('pointermove', onMove)
  area.addEventListener('pointerleave', onLeave)
  // #endregion code

  return () => {
    area.removeEventListener('pointermove', onMove)
    area.removeEventListener('pointerleave', onLeave)
  }
}

/** @type {import('./types').LiveDemo} */
export const magneticButton = {
  id: 'live-magnetic-button',
  name: 'Magnetic Button',
  description: 'The button leans toward the pointer and snaps back with an elastic ease when it leaves.',
  tags: ['interaction', 'quickTo', 'elastic.out', 'hover'],
  html,
  run,
}
