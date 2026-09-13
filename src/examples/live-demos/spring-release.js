const presets = ['gentle', 'default', 'bouncy', 'wobbly', 'stiff']

export const html = `<style>
  .sr-wrap { width: 260px; display: flex; flex-direction: column; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; }
  .sr-area { position: relative; width: 260px; height: 130px; border-radius: 10px; background: #151515; display: grid; place-items: center; touch-action: none; }
  .sr-card { width: 64px; height: 64px; border-radius: 14px; background: linear-gradient(135deg, #4a9eff, #9b59b6); cursor: grab; display: grid; place-items: center; color: #fff; font-weight: 700; }
  .sr-presets { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
  .sr-presets button { border: 1px solid #333; background: #1d1d1d; color: #aaa; border-radius: 6px; padding: 3px 7px; font: inherit; cursor: pointer; }
  .sr-presets button[aria-pressed="true"] { color: #fff; border-color: #4a9eff; }
</style>
<div class="sr-wrap">
  <div class="sr-area"><div class="sr-card">drag</div></div>
  <div class="sr-presets">${presets.map((p) => `<button data-preset="${p}" aria-pressed="${p === 'bouncy'}">${p}</button>`).join('')}</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const card = root.querySelector('.sr-card')
  let preset = 'bouncy'

  // Drag the card anywhere; let go and it springs home. The release velocity
  // feeds the spring, so a flick overshoots further than a gentle drop.
  live.draggable(card, {
    onPress: () => live.to(card, { scale: 1.1, spring: 'snappy' }),
    onRelease: (velocity) => {
      live.to(card, { x: 0, y: 0, scale: 1, rotate: 0, spring: { preset, velocity } })
    },
    onDrag: ({ x }) => live.set(card, { rotate: x / 8 }),
  })

  // Pick how the spring feels.
  root.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      preset = button.dataset.preset
      root.querySelectorAll('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)))
      // Show it off: knock the card and let it settle.
      live.fromTo(card, { y: -40 }, { y: 0, spring: preset })
    })
  })
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const springRelease = {
  id: 'live-spring-release',
  name: 'Spring Release',
  description: 'Drag and fling the card: it springs home carrying your release velocity. Presets change the feel — deterministic spring tracks, not a per-frame solver.',
  tags: ['spring', 'draggable', 'velocity', 'presets'],
  html,
  run,
}
