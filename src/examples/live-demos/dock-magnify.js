export const html = `<style>
  .dm-dock { display: flex; align-items: flex-end; gap: 8px; height: 90px; padding: 0 12px 10px; border-radius: 16px; background: rgba(255, 255, 255, 0.06); }
  .dm-icon { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; font-size: 17px; transform-origin: 50% 100%; }
  .dm-icon:nth-child(1) { background: #4a9eff; } .dm-icon:nth-child(2) { background: #9b59b6; }
  .dm-icon:nth-child(3) { background: #ec4899; } .dm-icon:nth-child(4) { background: #f59e0b; }
  .dm-icon:nth-child(5) { background: #3ecf7a; } .dm-icon:nth-child(6) { background: #14b8a6; }
  .dm-icon:nth-child(7) { background: #ef4444; }
</style>
<div class="dm-dock">
  <div class="dm-icon">📁</div><div class="dm-icon">🎨</div><div class="dm-icon">🎵</div><div class="dm-icon">📷</div>
  <div class="dm-icon">💬</div><div class="dm-icon">🗺️</div><div class="dm-icon">⚙️</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const dock = root.querySelector('.dm-dock')
  const icons = [...dock.querySelectorAll('.dm-icon')].map((element) => ({
    element,
    scale: live.quickTo(element, 'scale', { duration: 0.25, ease: 'power2.out' }),
    lift: live.quickTo(element, 'y', { duration: 0.25, ease: 'power2.out' }),
  }))

  const magnify = (icon, scale) => {
    icon.scale(scale)
    icon.lift((1 - scale) * 8)
  }

  // Icons scale from the bottom (transform-origin in the CSS), by how close the
  // pointer is horizontally, and lift a little as they grow.
  const onMove = (event) => {
    icons.forEach((icon) => {
      const box = icon.element.getBoundingClientRect()
      const distance = Math.abs(event.clientX - (box.left + box.width / 2))
      magnify(icon, 1 + Math.max(0, 1 - distance / 100) * 0.9)
    })
  }
  const onLeave = () => icons.forEach((icon) => magnify(icon, 1))

  dock.addEventListener('pointermove', onMove)
  dock.addEventListener('pointerleave', onLeave)
  // #endregion code

  return () => {
    dock.removeEventListener('pointermove', onMove)
    dock.removeEventListener('pointerleave', onLeave)
  }
}

/** @type {import('./types').LiveDemo} */
export const dockMagnify = {
  id: 'live-dock-magnify',
  name: 'Dock Magnify',
  description: 'A macOS-style dock: icons swell and lift by their distance from the pointer.',
  tags: ['interaction', 'quickTo', 'hover', 'transform-origin'],
  html,
  run,
}
