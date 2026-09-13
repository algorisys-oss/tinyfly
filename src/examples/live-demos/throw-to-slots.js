export const html = `<style>
  .ts-table { position: relative; width: 260px; height: 150px; border-radius: 10px; background: #1b1b1b; }
  .ts-slot { position: absolute; width: 64px; height: 44px; border: 2px dashed #333; border-radius: 8px; }
  .ts-card { position: absolute; left: 98px; top: 53px; width: 64px; height: 44px; border-radius: 8px; background: linear-gradient(135deg, #4a9eff, #9b59b6); box-shadow: 0 6px 16px rgba(0,0,0,0.4); cursor: grab; touch-action: none; }
  .ts-hint { position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; color: #555; font: 11px system-ui, sans-serif; pointer-events: none; }
</style>
<div class="ts-table">
  <div class="ts-slot" style="left: 12px; top: 12px"></div>
  <div class="ts-slot" style="left: 184px; top: 12px"></div>
  <div class="ts-slot" style="left: 12px; top: 90px"></div>
  <div class="ts-slot" style="left: 184px; top: 90px"></div>
  <div class="ts-hint">throw the card</div>
  <div class="ts-card"></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const table = root.querySelector('.ts-table')
  const card = root.querySelector('.ts-card')

  // Each slot as an offset from where the card sits — centre to centre, so it
  // does not matter how borders are sized — to use as snap points.
  const centre = (el) => {
    const box = el.getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
  }
  const home = centre(card)
  const slots = [...root.querySelectorAll('.ts-slot')].map((slot) => {
    const target = centre(slot)
    return { x: target.x - home.x, y: target.y - home.y }
  })

  // Drag it, let go, and it glides with the release velocity into the nearest slot.
  const drag = live.draggable(card, {
    bounds: table,
    inertia: { end: slots, friction: 5 },
    onPress: () => live.to(card, { scale: 1.08, duration: 0.15 }),
    onRelease: () => live.to(card, { scale: 1, duration: 0.3 }),
  })
  // #endregion code

  return () => drag.destroy()
}

/** @type {import('./types').LiveDemo} */
export const throwToSlots = {
  id: 'live-throw-to-slots',
  name: 'Throw to Slots',
  description: 'Throw the card: it keeps its release velocity, slows with friction and lands in the nearest slot. Draggable + inertia.',
  tags: ['draggable', 'inertia', 'snap', 'bounds'],
  html,
  run,
}
