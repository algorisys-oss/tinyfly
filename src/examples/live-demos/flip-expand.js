const blocks = ['#4a9eff', '#9b59b6', '#ec4899', '#f59e0b']
  .map((c) => `<div class="fe-block" style="background: ${c}"></div>`)
  .join('')

export const html = `<style>
  .fe-grid { display: grid; grid-template-columns: repeat(4, 52px); grid-auto-rows: 52px; gap: 8px; width: 232px; }
  .fe-block { border-radius: 10px; cursor: pointer; }
  .fe-block.open { grid-column: 1 / -1; grid-row: span 2; }
  .fe-hint { margin-top: 10px; color: #555; font: 11px system-ui, sans-serif; text-align: center; }
</style>
<div>
  <div class="fe-grid">${blocks}</div>
  <div class="fe-hint">click a block</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const blocks = root.querySelectorAll('.fe-block')

  // Opening a block makes it span the grid; the others reflow around it.
  // Flip animates the resize with scale (about each centre) and the moves.
  const onClick = (event) => {
    const clicked = event.target.closest('.fe-block')
    if (!clicked) return
    live.flip(blocks, () => {
      const opening = !clicked.classList.contains('open')
      blocks.forEach((block) => block.classList.toggle('open', opening && block === clicked))
    }, { duration: 0.6, ease: 'power3.inOut' })
  }

  root.addEventListener('click', onClick)
  // #endregion code

  return () => root.removeEventListener('click', onClick)
}

/** @type {import('./types').LiveDemo} */
export const flipExpand = {
  id: 'live-flip-expand',
  name: 'Flip: Expand Tile',
  description: 'Click a block to open it across the grid while the rest reflow — size and position animated together.',
  tags: ['flip', 'resize', 'grid', 'click'],
  html,
  run,
  requiresLayout: true,
}
