const tiles = Array.from({ length: 9 }, (_, i) => `<div class="fs-tile" data-n="${i + 1}">${i + 1}</div>`).join('')

export const html = `<style>
  .fs-wrap { display: flex; gap: 14px; align-items: center; }
  .fs-grid { display: grid; grid-template-columns: repeat(3, 40px); gap: 8px; }
  .fs-tile { width: 40px; height: 40px; border-radius: 8px; display: grid; place-items: center; color: #fff; font: 700 15px system-ui, sans-serif; background: linear-gradient(135deg, #4a9eff, #9b59b6); }
  .fs-controls { display: flex; flex-direction: column; gap: 6px; }
  .fs-controls button { padding: 5px 10px; border: 1px solid #333; border-radius: 6px; background: #222; color: #ddd; font-size: 12px; cursor: pointer; }
</style>
<div class="fs-wrap">
  <div class="fs-grid">${tiles}</div>
  <div class="fs-controls"><button data-action="shuffle">Shuffle</button><button data-action="sort">Sort</button></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const grid = root.querySelector('.fs-grid')

  // Reorder the DOM however you like; flip animates each tile from where it
  // was to where it landed.
  const reorder = (order) => {
    live.flip('.fs-tile', () => order([...grid.children]).forEach((tile) => grid.appendChild(tile)), {
      duration: 0.55,
      ease: 'power2.inOut',
      stagger: 0.02,
    })
  }

  const onClick = (event) => {
    const action = event.target.closest('button')?.dataset.action
    if (action === 'shuffle') reorder((tiles) => tiles.sort(() => Math.random() - 0.5))
    if (action === 'sort') reorder((tiles) => tiles.sort((a, b) => a.dataset.n - b.dataset.n))
  }

  root.addEventListener('click', onClick)
  // #endregion code

  return () => root.removeEventListener('click', onClick)
}

/** @type {import('./types').LiveDemo} */
export const flipShuffle = {
  id: 'live-flip-shuffle',
  name: 'Flip: Shuffle Grid',
  description: 'Reorder the DOM and every tile glides to its new cell — Flip measures before and after, then animates the difference.',
  tags: ['flip', 'layout', 'stagger', 'reorder'],
  html,
  run,
  requiresLayout: true,
}
