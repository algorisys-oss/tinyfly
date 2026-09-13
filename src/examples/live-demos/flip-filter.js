const colours = ['#ec4899', '#4a9eff', '#3ecf7a']
const names = ['pink', 'blue', 'green']
const items = Array.from({ length: 12 }, (_, i) => {
  const c = i % 3
  return `<div class="ff-item" data-kind="${names[c]}" style="background: ${colours[c]}"></div>`
}).join('')

export const html = `<style>
  .ff-controls { display: flex; gap: 6px; margin-bottom: 10px; }
  .ff-controls button { padding: 4px 9px; border: 1px solid #333; border-radius: 999px; background: #222; color: #ddd; font-size: 11px; cursor: pointer; }
  .ff-controls button.on { border-color: #4a9eff; color: #fff; }
  .ff-grid { display: flex; flex-wrap: wrap; gap: 8px; width: 256px; min-height: 112px; align-content: flex-start; }
  .ff-item { width: 34px; height: 34px; border-radius: 8px; }
  .ff-item.hidden { display: none; }
</style>
<div>
  <div class="ff-controls">
    <button data-kind="all" class="on">All</button><button data-kind="pink">Pink</button><button data-kind="blue">Blue</button><button data-kind="green">Green</button>
  </div>
  <div class="ff-grid">${items}</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const buttons = root.querySelectorAll('.ff-controls button')

  const onClick = (event) => {
    const button = event.target.closest('button')
    if (!button) return
    const kind = button.dataset.kind
    buttons.forEach((b) => b.classList.toggle('on', b === button))

    // Hide and show with a class. Items that stay glide to their new places;
    // items that reappear fade and grow in.
    live.flip('.ff-item', () => {
      root.querySelectorAll('.ff-item').forEach((item) => {
        item.classList.toggle('hidden', kind !== 'all' && item.dataset.kind !== kind)
      })
    }, { duration: 0.5, ease: 'power2.inOut', stagger: 0.015, enter: { opacity: 0, scale: 0.4 } })
  }

  root.addEventListener('click', onClick)
  // #endregion code

  return () => root.removeEventListener('click', onClick)
}

/** @type {import('./types').LiveDemo} */
export const flipFilter = {
  id: 'live-flip-filter',
  name: 'Flip: Filter Gallery',
  description: 'Filter by colour: remaining items glide into the gaps, and items that come back fade and grow in.',
  tags: ['flip', 'filter', 'enter', 'display: none'],
  html,
  run,
  requiresLayout: true,
}
