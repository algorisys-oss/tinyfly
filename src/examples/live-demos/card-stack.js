export const html = `<style>
  .cs-stack { position: relative; width: 170px; height: 110px; cursor: pointer; }
  .cs-card { position: absolute; inset: 0; border-radius: 12px; display: grid; place-items: center; color: #fff; font: 700 18px system-ui, sans-serif; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); }
  .cs-card:nth-child(1) { background: #4a9eff; } .cs-card:nth-child(2) { background: #9b59b6; }
  .cs-card:nth-child(3) { background: #ec4899; } .cs-card:nth-child(4) { background: #f59e0b; }
  .cs-hint { margin-top: 28px; color: #555; font: 11px system-ui, sans-serif; text-align: center; }
</style>
<div>
  <div class="cs-stack">
    <div class="cs-card">One</div><div class="cs-card">Two</div><div class="cs-card">Three</div><div class="cs-card">Four</div>
  </div>
  <div class="cs-hint">click the stack</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const stack = root.querySelector('.cs-stack')
  const cards = [...stack.querySelectorAll('.cs-card')] // cards[0] is on top
  let busy = false

  // Fan the cards back by their position in the stack.
  const layout = () => {
    cards.forEach((card, i) => {
      live.set(card, { zIndex: cards.length - i })
      live.to(card, { y: i * 12, scale: 1 - i * 0.06, duration: 0.45, ease: 'power3.out' })
    })
  }

  // Throw the top card away, then bring it back in at the bottom.
  const next = () => {
    if (busy) return
    busy = true
    const top = cards.shift()
    live.to(top, {
      x: 200,
      rotate: 16,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        cards.push(top)
        live.set(top, { x: 0, rotate: 0 })
        layout()
        live.to(top, { opacity: 1, duration: 0.3, delay: 0.15, onComplete: () => (busy = false) })
      },
    })
  }

  layout()
  stack.addEventListener('click', next)
  // #endregion code

  return () => stack.removeEventListener('click', next)
}

/** @type {import('./types').LiveDemo} */
export const cardStack = {
  id: 'live-card-stack',
  name: 'Card Stack',
  description: 'Click to throw the top card away; the rest move up and it rejoins at the back. Sequenced with onComplete.',
  tags: ['onComplete', 'sequencing', 'zIndex', 'click'],
  html,
  run,
}
