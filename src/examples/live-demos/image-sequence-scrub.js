export const html = `<style>
  .sq-scroller { width: 260px; height: 190px; overflow-y: auto; border-radius: 8px; background: #0e0e10; color: #aaa; font: 12px system-ui, sans-serif; }
  .sq-note { height: 80px; display: grid; place-items: center; }
  .sq-stage { height: 190px; display: grid; place-items: center; background: radial-gradient(circle at 50% 60%, #1d2330, #0e0e10 70%); }
  .sq-canvas { width: 220px; height: 150px; }
  .sq-progress { position: absolute; left: 8px; bottom: 6px; font: 11px ui-monospace, monospace; color: #6b7280; }
</style>
<div class="sq-scroller">
  <div class="sq-note">Scroll to turn ↓</div>
  <div class="sq-stage"><canvas class="sq-canvas"></canvas><span class="sq-progress"></span></div>
  <div class="sq-note">…all the way round</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  // A real site would load numbered image files here (a rendered product turning).
  // To stay self-contained, this draws 48 frames of a cube and uses them as images.
  const FRAMES = 48
  const frameUrls = makeCubeFrames(FRAMES)

  const readout = root.querySelector('.sq-progress')
  const sequence = live.imageSequence('.sq-canvas', {
    frames: FRAMES,
    url: (i) => frameUrls[i],
    onProgress: (loaded, total) => loaded < total && (readout.textContent = `loading ${loaded}/${total}`),
  })

  // Scrub the frame with scroll while the stage is pinned.
  live.to(sequence, {
    frame: FRAMES - 1,
    ease: 'none',
    onUpdate: () => (readout.textContent = `frame ${Math.round(sequence.frame) + 1} / ${FRAMES}`),
    scrollTrigger: {
      trigger: '.sq-stage',
      scroller: '.sq-scroller',
      start: 'top top',
      end: '+=320',
      scrub: 0.2,
      pin: true,
    },
  })

  function makeCubeFrames(count) {
    const canvas = document.createElement('canvas')
    canvas.width = 440
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    if (!ctx) return new Array(count).fill('')
    const corners = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z])))
    const faces = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]
    const colours = ['#c6ff3d', '#4a9eff', '#ec4899', '#f59e0b', '#8b5cf6', '#10b981']
    return Array.from({ length: count }, (_, frame) => {
      const angle = (frame / count) * Math.PI * 2
      const project = ([x, y, z]) => {
        const rx = x * Math.cos(angle) - z * Math.sin(angle)
        const rz = x * Math.sin(angle) + z * Math.cos(angle)
        const ry = y * Math.cos(0.5) - rz * Math.sin(0.5)
        const depth = y * Math.sin(0.5) + rz * Math.cos(0.5)
        const scale = 90 / (depth + 4)
        return [220 + rx * scale * 1.6, 150 + ry * scale * 1.6, depth]
      }
      const points = corners.map(project)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      faces
        .map((face, i) => ({ face, colour: colours[i], depth: face.reduce((sum, c) => sum + points[c][2], 0) }))
        .sort((a, b) => b.depth - a.depth)
        .forEach(({ face, colour }) => {
          ctx.beginPath()
          face.forEach((c, i) => (i ? ctx.lineTo(points[c][0], points[c][1]) : ctx.moveTo(points[c][0], points[c][1])))
          ctx.closePath()
          ctx.fillStyle = colour
          ctx.globalAlpha = 0.9
          ctx.fill()
          ctx.globalAlpha = 1
          ctx.strokeStyle = '#0e0e10'
          ctx.lineWidth = 3
          ctx.stroke()
        })
      return canvas.toDataURL('image/png')
    })
  }
  // #endregion code

  return () => sequence.destroy()
}

/** @type {import('./types').LiveDemo} */
export const imageSequenceScrub = {
  id: 'live-image-sequence-scrub',
  name: 'Image Sequence Scrub',
  description: 'Scroll inside the card to turn the object: live.imageSequence draws frame N of an image sequence, and scrollTrigger scrubs N.',
  tags: ['scroll', 'imageSequence', 'canvas', 'pin', 'scrub'],
  // Images load and draw only in a real browser.
  requiresLayout: true,
  html,
  run,
}
