const photos = [
  ['Dunes', '#f59e0b', '#ec4899'],
  ['Glacier', '#4a9eff', '#3ecf7a'],
  ['Canyon', '#ef4444', '#f59e0b'],
  ['Nebula', '#9b59b6', '#4a9eff'],
]

export const html = `<style>
  .sg-wrap { position: relative; width: 260px; height: 190px; font: 600 12px system-ui, sans-serif; color: #fff; }
  .sg-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .sg-thumb { height: 91px; border-radius: 10px; cursor: pointer; display: flex; align-items: flex-end; padding: 8px; box-sizing: border-box; }
  .sg-detail { position: absolute; inset: 0; border-radius: 12px; background: rgba(12, 12, 14, 0.94); display: flex; flex-direction: column; gap: 8px; padding: 10px; box-sizing: border-box; cursor: pointer; }
  .sg-detail[hidden] { display: none; }
  .sg-hero { height: 130px; border-radius: 10px; }
  .sg-caption { font-size: 15px; }
</style>
<div class="sg-wrap">
  <div class="sg-grid">${photos
    .map(([name, a, b], i) => `<div class="sg-thumb" data-flip-id="photo-${i}" style="background: linear-gradient(135deg, ${a}, ${b})">${name}</div>`)
    .join('')}</div>
  <div class="sg-detail" hidden><div class="sg-hero"></div><div class="sg-caption"></div></div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const detail = root.querySelector('.sg-detail')
  const hero = root.querySelector('.sg-hero')
  const caption = root.querySelector('.sg-caption')
  let openThumb = null

  // Open: the hero is a different element, but it shares the thumbnail's
  // data-flip-id, so it grows out of exactly where the thumbnail was.
  root.querySelectorAll('.sg-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      if (openThumb) return
      openThumb = thumb
      const state = live.getFlipState(thumb)

      hero.dataset.flipId = thumb.dataset.flipId
      hero.style.background = thumb.style.background
      caption.textContent = thumb.textContent
      detail.hidden = false

      live.flipFrom(state, { targets: hero, fade: true, duration: 0.6, ease: 'power3.inOut' })
      live.fromTo(caption, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.3 })
    })
  })

  // Close: record the hero, hide the detail, and the thumbnail flips back from it.
  detail.addEventListener('click', () => {
    if (!openThumb) return
    const thumb = openThumb
    openThumb = null
    const state = live.getFlipState(hero)
    detail.hidden = true
    live.flipFrom(state, { targets: thumb, fade: true, duration: 0.5, ease: 'power3.inOut' })
  })
  // #endregion code
}

/** @type {import('./types').LiveDemo} */
export const sharedElementGallery = {
  id: 'live-shared-element-gallery',
  name: 'Shared Element Gallery',
  description: 'Click a photo: a separate hero element grows out of the thumbnail and back — Flip matching elements by data-flip-id.',
  tags: ['flip', 'data-flip-id', 'shared element', 'fade'],
  requiresLayout: true,
  html,
  run,
}
