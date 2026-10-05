const cells = Array.from({ length: 24 }, () => '<div class="stg-cell"></div>').join('')

export const html = `<style>
  .stg-grid { display: grid; grid-template-columns: repeat(8, 22px); gap: 8px; }
  .stg-cell { width: 22px; height: 22px; border-radius: 6px; background: #4a9eff; }
</style>
<div class="stg-grid">${cells}</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 */
export function run(live) {
  // #region code
  live
    .timeline({ repeat: -1, yoyo: true, repeatDelay: 0.4 })
    .fromTo(
      '.stg-cell',
      { opacity: 0, scale: 0.2, y: 24 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        ease: 'back.out',
        stagger: { each: 0.035, from: 'center' },
      }
    )
    .fromTo(
      '.stg-cell',
      { backgroundColor: '#4a9eff' },
      { backgroundColor: '#3ecf7a', duration: 0.3, stagger: { amount: 0.4, from: 'edges' } },
      '-=0.2'
    )
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const staggerGrid = {
  id: 'live-stagger-grid',
  name: 'Staggered Grid',
  description: 'One selector, 24 elements: a centre-out entrance with a back ease, then a colour wave from the edges. Repeats with yoyo.',
  tags: ['stagger', 'from: center', 'yoyo', 'back.out'],
  html,
  run,
}
