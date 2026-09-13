export const html = `<style>
  .ls-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .ls-logo { width: 46px; height: 46px; border-radius: 12px; background: linear-gradient(135deg, #4a9eff, #9b59b6); }
  .ls-title { color: #fff; font: 700 22px system-ui, sans-serif; letter-spacing: 0.5px; }
  .ls-sub { color: #9bb4c7; font: 12px system-ui, sans-serif; }
</style>
<div class="ls-wrap">
  <div class="ls-logo"></div>
  <div class="ls-title">tinyfly</div>
  <div class="ls-sub">animation engine</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 */
export function run(live) {
  // #region code
  live
    .timeline({ repeat: -1, repeatDelay: 0.8 })
    .fromTo('.ls-logo', { scale: 0, rotate: -180 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out' })
    .addLabel('text', '-=0.25')
    .fromTo('.ls-title', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 'text')
    .fromTo('.ls-sub', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 'text+=0.15')
    .to('.ls-logo', { rotate: 360, duration: 0.6, ease: 'power2.inOut' }, '>0.4')
    .to(['.ls-logo', '.ls-title', '.ls-sub'], { opacity: 0, duration: 0.3, stagger: 0.08 }, '+=0.6')
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const labelSequence = {
  id: 'live-label-sequence',
  name: 'Logo Sequence',
  description: 'A choreographed intro using labels and position parameters: "-=0.25", "text+=0.15", ">0.4", "+=0.6".',
  tags: ['timeline', 'labels', 'position parameters', 'back.out'],
  html,
  run,
}
