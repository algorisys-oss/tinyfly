import { drawSkyGradient, drawDust, drawBokeh, drawShadedBall, drawIsoCube, drawHaze, drawZoomLevels, depthAt, levelPresence, drawShortCaption, drawLabelChip, drawCornerNote, drawGlow, drawVignette } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { drawSkyGradient, drawDust, drawBokeh, drawShadedBall, drawIsoCube, drawHaze, drawZoomLevels, depthAt, levelPresence, drawShortCaption, drawLabelChip, drawCornerNote, drawGlow, drawVignette }

export const html = `<style>
.cosdive-wrap { display:grid;gap:8px;width:100%;max-width:min(960px,calc(100vw - 24px));min-width:0; }
.cosdive-canvas { display:block;width:100%;height:auto;aspect-ratio:16/9;background:#0b1026;border-radius:10px; }
.cosdive-row { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:12px system-ui;color:#cbd5e1; }
.cosdive-scrub { flex:1;min-width:160px; }
.cosdive-readout { font:12px ui-monospace,monospace;color:#9bb4c7; }
</style><div class="cosdive-wrap">
<canvas class="cosdive-canvas" width="1920" height="1080"></canvas>
<div class="cosdive-row">
<label><input type="checkbox" class="cosdive-play" checked /> play</label>
<input type="range" class="cosdive-scrub" min="0" max="12000" step="10" value="0" />
<label><input type="checkbox" class="cosdive-captions" checked /> captions</label>
</div><div class="cosdive-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.cosdive-canvas')
  const ctx = canvas.getContext('2d')
  const play = root.querySelector('.cosdive-play')
  const scrub = root.querySelector('.cosdive-scrub')
  const captions = root.querySelector('.cosdive-captions')
  const readout = root.querySelector('.cosdive-readout')
  const W = 1920
  const H = 1080
  const C = { x: 960, y: 500 }
  const LOOP = 12000
  // The dive: depth keys, each level landing on the word that names it.
  const dive = [{ time: 1800, value: 0 }, { time: 3400, value: 1.35 }, { time: 5400, value: 2.35 }, { time: 7600, value: 3.35 }]
  const labels = ['your hand', 'skin', 'cells', 'one atom']
  const lines = [
    { text: 'You are mostly empty space.', start: 300, end: 1700 },
    { text: 'Zoom in. Skin. Cells. Atoms.', start: 1900, end: 7400 },
    { text: 'The nucleus holds almost all the mass.', start: 8000, end: 11600 },
  ]
  // Each level draws itself at scale 1 around the zoom centre; drawZoomLevels zooms it.
  const hand = () => {
    tinyfly.drawSkyGradient(ctx, { width: W, height: H, sky: 'cyan' })
    tinyfly.drawShadedBall(ctx, { x: C.x, y: C.y, radius: 140, color: '#f2c49b' })
    for (let i = 0; i < 4; i++) tinyfly.drawShadedBall(ctx, { x: C.x - 105 + i * 70, y: C.y - 175, radius: 40, color: '#f2c49b' })
  }
  const skin = () => {
    ctx.fillStyle = '#f2c49b'
    ctx.fillRect(C.x - 1400, C.y - 1400, 2800, 2800)
    ctx.strokeStyle = '#d4a479'
    ctx.lineWidth = 12
    for (let r = 40; r < 1300; r += 44) {
      ctx.beginPath()
      ctx.ellipse(C.x, C.y + 40, r, r * 1.25, 0, Math.PI * 1.1, Math.PI * 2.9)
      ctx.stroke()
    }
  }
  const cells = () => {
    tinyfly.drawSkyGradient(ctx, { width: W, height: H, top: '#fbcfe8', bottom: '#db2777' })
    for (let gy = -6; gy <= 6; gy++) {
      for (let gx = -9; gx <= 9; gx++) {
        const x = C.x + gx * 140 + (gy % 2 ? 70 : 0)
        const y = C.y + gy * 122
        tinyfly.drawShadedBall(ctx, { x, y, radius: 60, color: '#fda4af' })
        tinyfly.drawShadedBall(ctx, { x: x + 10, y: y + 8, radius: 20, color: '#be185d', highlight: false })
      }
    }
  }
  const atom = (_, t) => {
    tinyfly.drawSkyGradient(ctx, { width: W, height: H, sky: 'space' })
    tinyfly.drawHaze(ctx, t, { x: C.x, y: C.y, radius: 120, dots: 520, dot: 1.6 })
    tinyfly.drawGlow(ctx, { x: C.x, y: C.y, radius: 60, color: '#fb923c', opacity: 0.8 })
    tinyfly.drawShadedBall(ctx, { x: C.x, y: C.y, radius: 6, color: '#fb923c', highlight: false })
  }
  const clock = { time: 0 }
  const animation = live.to(clock, { time: LOOP, duration: LOOP / 1000, ease: 'none', repeat: -1 })

  function draw() {
    if (play.checked) scrub.value = String(Math.round(clock.time))
    const t = play.checked ? clock.time : Number(scrub.value)
    const depth = tinyfly.depthAt(t, dive)
    readout.textContent = `t ${(t / 1000).toFixed(2)} s · depth ${depth.toFixed(2)} · level ${labels[Math.max(0, Math.min(3, Math.round(depth - 0.35)))]}`
    if (!ctx) return
    tinyfly.drawZoomLevels(ctx, t, { width: W, height: H, depth, levels: [hand, skin, cells, atom], center: C })
    // Depth over everything, moving a little with the dive; no frame is ever still.
    tinyfly.drawBokeh(ctx, t, { width: W, height: H, offset: { x: depth * 60, y: 0 } })
    tinyfly.drawDust(ctx, t, { width: W, height: H, count: 80, offset: { x: depth * 90, y: 0 } })
    labels.forEach((text, level) => {
      if (tinyfly.levelPresence(depth, level) > 0.5) tinyfly.drawLabelChip(ctx, t, { text, x: C.x, y: 90, size: 44, at: level ? dive[level].time - 250 : 0 })
    })
    if (t > 8000) {
      tinyfly.drawLabelChip(ctx, t, { text: 'nucleus: 99.9%+ of the mass', x: C.x, y: 180, size: 36, at: 8400 })
      tinyfly.drawIsoCube(ctx, { x: 1500, y: 600, size: 110 * Math.min(1, (t - 8000) / 600), color: '#fb923c', sheen: 0.6 })
      tinyfly.drawCornerNote(ctx, { text: '*not to scale', x: W - 40, y: 60 })
    }
    tinyfly.drawVignette(ctx, { width: W, height: H, opacity: 0.35 })
    if (captions.checked) tinyfly.drawShortCaption(ctx, t, { lines, x: C.x, y: H * 0.88, size: 54 })
  }
  draw()
  live.ticker.add(draw)
  // #endregion code
  return () => { animation.kill(); live.ticker.remove(draw) }
}

/** @type {import('./types').LiveDemo} */
export const cosmicDive = {
  id: 'live-cosmic-dive',
  name: 'Cosmic Dive',
  description:
    'A science-explainer dive through scale from the cosmic kit: from a hand to skin, cells and one atom, each level opening as a growing portal in the middle of the last (drawZoomLevels with depthAt), over gradient skies, parallax dust and bokeh, flat-shaded spheres, a probability haze and an isometric cube, with label chips and burned-in captions two words at a time. Pause and scrub to any moment: every frame is a pure function of time.',
  category: 'video',
  alsoIn: ['showcase'],
  tags: ['cosmic', 'science', 'explainer', 'zoom', 'scale', 'portal', 'captions', 'bokeh', 'canvas'],
  html,
  run,
}
