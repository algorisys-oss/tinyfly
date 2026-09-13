const people = [
  ['Ada', '#4a9eff'], ['Linus', '#9b59b6'], ['Grace', '#ec4899'], ['Alan', '#f59e0b'],
]
const cards = people
  .map(([name, colour]) => `<div class="sw-card" style="background: linear-gradient(160deg, ${colour}, #1b1b1b)"><span>${name}</span></div>`)
  .join('')

export const html = `<style>
  .sw-stack { position: relative; width: 130px; height: 150px; }
  .sw-card { position: absolute; inset: 0; border-radius: 14px; display: flex; align-items: flex-end; padding: 12px; color: #fff; font: 700 16px system-ui, sans-serif; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45); cursor: grab; touch-action: none; user-select: none; }
  .sw-hint { margin-top: 10px; color: #555; font: 11px system-ui, sans-serif; text-align: center; }
</style>
<div>
  <div class="sw-stack">${cards}</div>
  <div class="sw-hint">swipe the top card away</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const stack = root.querySelector('.sw-stack')
  const cards = [...stack.querySelectorAll('.sw-card')] // the last one is on top
  let drag = null

  const makeTopDraggable = () => {
    const top = cards[cards.length - 1]
    drag = live.draggable(top, {
      type: 'x',
      // Three places to land: gone left, back in the middle, gone right.
      inertia: { end: { x: [-300, 0, 300] }, friction: 5 },
      onDrag: ({ x }) => live.set(top, { rotate: x / 10 }),
      onThrowComplete: () => {
        if (Math.abs(drag.position.x) < 1) {
          live.to(top, { rotate: 0, duration: 0.35, ease: 'back.out' })
          return
        }
        // Swiped away: send it to the back of the pile and deal the next card.
        drag.destroy()
        cards.unshift(cards.pop())
        stack.prepend(top)
        live.set(top, { x: 0, rotate: 0, opacity: 0 })
        live.to(top, { opacity: 1, duration: 0.4, delay: 0.1 })
        makeTopDraggable()
      },
    })
  }

  makeTopDraggable()
  // #endregion code

  return () => drag?.destroy()
}

/** @type {import('./types').LiveDemo} */
export const swipeCards = {
  id: 'live-swipe-cards',
  name: 'Swipe Cards',
  description: 'Throw the top card left or right to dismiss it, or let go gently and it slides back. Draggable with three landing points.',
  tags: ['draggable', 'inertia', 'end', 'onThrowComplete'],
  html,
  run,
}
