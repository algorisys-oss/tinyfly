export const html = `<style>
  .tc-track { position: relative; width: 240px; height: 40px; }
  .tc-car { position: absolute; left: 0; top: 8px; width: 24px; height: 24px; border-radius: 6px; background: #4a9eff; }
  .tc-controls { display: flex; gap: 6px; align-items: center; margin-top: 14px; }
  .tc-controls button { padding: 3px 8px; border: 1px solid #333; border-radius: 4px; background: #222; color: #ddd; font-size: 11px; cursor: pointer; }
  .tc-controls input { width: 90px; }
</style>
<div>
  <div class="tc-track"><div class="tc-car"></div></div>
  <div class="tc-controls">
    <button data-action="play">Play</button>
    <button data-action="pause">Pause</button>
    <button data-action="reverse">Reverse</button>
    <button data-action="speed">1×</button>
    <input type="range" min="0" max="1" step="0.001" value="0" aria-label="Scrub" />
  </div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const tl = live
    .timeline({ paused: true })
    .to('.tc-car', { x: 216, rotate: 360, duration: 2, ease: 'power2.inOut' })
    .fromTo('.tc-car', { backgroundColor: '#4a9eff' }, { backgroundColor: '#3ecf7a', duration: 0.4 }, '<1.6')

  const scrub = root.querySelector('input')
  let speed = 1

  const onClick = (event) => {
    const button = event.target.closest('button')
    const action = button?.dataset.action
    if (action === 'play') tl.play()
    if (action === 'pause') tl.pause()
    if (action === 'reverse') tl.reverse()
    if (action === 'speed' && button) {
      speed = speed === 1 ? 0.25 : speed === 0.25 ? 3 : 1
      tl.timeScale(speed)
      button.textContent = `${speed}×`
    }
  }
  const onScrub = () => {
    tl.pause()
    tl.progress(Number(scrub.value))
  }
  const syncSlider = () => {
    if (document.activeElement !== scrub) scrub.value = String(tl.progress())
    frame = requestAnimationFrame(syncSlider)
  }

  root.addEventListener('click', onClick)
  scrub.addEventListener('input', onScrub)
  let frame = requestAnimationFrame(syncSlider)
  tl.play()
  // #endregion code

  return () => {
    root.removeEventListener('click', onClick)
    scrub.removeEventListener('input', onScrub)
    cancelAnimationFrame(frame)
  }
}

/** @type {import('./types').LiveDemo} */
export const timelineControls = {
  id: 'live-timeline-controls',
  name: 'Timeline Controls',
  description: 'play, pause, reverse, timeScale and a progress() scrubber, wired to a live timeline.',
  tags: ['playback', 'progress', 'timeScale', 'reverse'],
  html,
  run,
}
