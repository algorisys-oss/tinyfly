const stats = [
  ['Users', '48,210', 0.86, '#4a9eff'],
  ['Revenue', '$9,742', 0.64, '#3ecf7a'],
  ['Uptime', '99.98%', 0.97, '#f59e0b'],
]
const rows = stats
  .map(([label, value, share, colour]) => `<div class="sd-row" data-share="${share}">
  <span class="sd-label">${label}</span>
  <span class="sd-value" data-value="${value}">------</span>
  <div class="sd-bar"><div class="sd-fill" style="background: ${colour}"></div></div>
</div>`)
  .join('')

export const html = `<style>
  .sd-panel { width: 250px; }
  .sd-row { display: grid; grid-template-columns: 64px 1fr; align-items: center; row-gap: 4px; margin-bottom: 10px; }
  .sd-label { color: #777; font: 11px system-ui, sans-serif; }
  .sd-value { color: #fff; font: 700 16px ui-monospace, SFMono-Regular, Menlo, monospace; text-align: right; }
  .sd-bar { grid-column: 1 / -1; height: 6px; border-radius: 3px; background: #262626; overflow: hidden; }
  .sd-fill { width: 100%; height: 100%; border-radius: 3px; transform-origin: 0 50%; transform: scaleX(0); }
</style>
<div class="sd-panel">${rows}</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const tl = live.timeline({ repeat: -1, repeatDelay: 1.5 })

  root.querySelectorAll('.sd-row').forEach((row, i) => {
    const value = row.querySelector('.sd-value')
    const fill = row.querySelector('.sd-fill')
    const at = i * 0.25

    // Digits cycle, then lock in left to right; the bar grows to its share.
    tl.fromTo(value, { text: '------' }, {
      scrambleText: { text: value.dataset.value, chars: 'numbers', revealDelay: 0.4 },
      duration: 1.2,
    }, at)
    tl.fromTo(fill, { scaleX: 0 }, { scaleX: Number(row.dataset.share), duration: 1.2, ease: 'power3.out' }, at)
  })
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const statsDecode = {
  id: 'live-stats-decode',
  name: 'Stats Decode',
  description: 'Dashboard figures decode digit by digit while their bars grow, row after row.',
  tags: ['scrambleText', 'numbers', 'scaleX', 'stagger'],
  html,
  run,
}
