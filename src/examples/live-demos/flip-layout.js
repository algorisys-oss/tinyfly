const tiles = ['#4a9eff', '#9b59b6', '#ec4899', '#f59e0b', '#3ecf7a', '#14b8a6']
  .map((c) => `<div class="fl-tile" style="background: ${c}"></div>`)
  .join('')

export const html = `<style>
  .fl-controls { display: flex; gap: 6px; margin-bottom: 12px; justify-content: center; }
  .fl-controls button { padding: 4px 10px; border: 1px solid #333; border-radius: 6px; background: #222; color: #ddd; font-size: 11px; cursor: pointer; }
  .fl-stage { position: relative; width: 250px; height: 110px; }
  .fl-box { position: relative; display: grid; gap: 8px; }
  .fl-box.grid { grid-template-columns: repeat(3, 36px); justify-content: center; }
  .fl-box.row { grid-template-columns: repeat(6, 36px); justify-content: center; padding-top: 36px; }
  .fl-box.pile { grid-template-columns: 36px; justify-content: center; }
  .fl-box.pile .fl-tile { grid-area: 1 / 1; }
  .fl-box.pile .fl-tile:nth-child(n) { margin: calc(var(--i) * 3px) 0 0 calc(var(--i) * 3px); }
  .fl-tile { width: 36px; height: 36px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); }
</style>
<div>
  <div class="fl-controls"><button data-layout="grid">Grid</button><button data-layout="row">Row</button><button data-layout="pile">Pile</button></div>
  <div class="fl-stage"><div class="fl-box grid">${tiles}</div></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const box = root.querySelector('.fl-box')
  root.querySelectorAll('.fl-tile').forEach((tile, i) => tile.style.setProperty('--i', String(i)))

  // The layouts are pure CSS classes. Flip only needs to know which elements
  // to watch; the class change itself can be anything.
  const onClick = (event) => {
    const layout = event.target.closest('button')?.dataset.layout
    if (!layout) return
    live.flip('.fl-tile', () => {
      box.className = `fl-box ${layout}`
    }, { duration: 0.7, ease: 'power3.inOut', stagger: 0.04 })
  }

  root.addEventListener('click', onClick)
  // #endregion code

  return () => root.removeEventListener('click', onClick)
}

/** @type {import('./types').LiveDemo} */
export const flipLayout = {
  id: 'live-flip-layout',
  name: 'Flip: Layout Switch',
  description: 'Switch between grid, row and pile layouts — only CSS classes change, and Flip animates each tile across.',
  tags: ['flip', 'css classes', 'stagger', 'power3.inOut'],
  html,
  run,
  requiresLayout: true,
}
