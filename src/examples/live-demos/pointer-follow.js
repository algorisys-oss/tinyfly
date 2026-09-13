export const html = `<style>
  .pf-area { position: relative; width: 260px; height: 150px; border-radius: 8px; background: #1b1b1b; cursor: crosshair; overflow: hidden; }
  .pf-dot { position: absolute; left: -9px; top: -9px; width: 18px; height: 18px; border-radius: 50%; pointer-events: none; }
  .pf-dot:nth-child(1) { background: #4a9eff; }
  .pf-dot:nth-child(2) { background: #9b59b6; width: 14px; height: 14px; left: -7px; top: -7px; }
  .pf-dot:nth-child(3) { background: #ec4899; width: 10px; height: 10px; left: -5px; top: -5px; }
  .pf-hint { position: absolute; left: 0; right: 0; bottom: 8px; text-align: center; color: #555; font: 11px system-ui, sans-serif; }
</style>
<div class="pf-area">
  <div class="pf-dot"></div><div class="pf-dot"></div><div class="pf-dot"></div>
  <div class="pf-hint">move the pointer here</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const area = root.querySelector('.pf-area')
  const dots = area.querySelectorAll('.pf-dot')
  live.set(dots, { x: 130, y: 75 })

  // Every move starts a fresh tween from wherever each dot is now; the newest
  // tween wins, so the dots chase the pointer. Later dots lag behind.
  const onMove = (event) => {
    const box = area.getBoundingClientRect()
    const x = event.clientX - box.left
    const y = event.clientY - box.top
    dots.forEach((dot, i) => {
      live.to(dot, { x, y, duration: 0.3 + i * 0.15, ease: 'power3.out' })
    })
  }

  area.addEventListener('pointermove', onMove)
  // #endregion code

  return () => area.removeEventListener('pointermove', onMove)
}

/** @type {import('./types').LiveDemo} */
export const pointerFollow = {
  id: 'live-pointer-follow',
  name: 'Pointer Follow',
  description: 'A new tween per pointer move. Each starts from the value tinyfly last applied, so motion stays continuous.',
  tags: ['interaction', 'overwrite', 'power3.out'],
  html,
  run,
}
