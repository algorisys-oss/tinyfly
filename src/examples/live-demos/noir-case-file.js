import { BEAN_CAST, castMember, character, drawCharacter, humanPose, HUMAN_POSES, HUMAN_EXPRESSIONS, drawRain, drawBlinds, drawDarkness, drawGlow, drawVignette, drawClueMarker, drawEvidenceFolder, drawClockFace, drawTimeChip, drawNameCard, drawNarrationBox, drawSpeechBubble, caseBoard, drawCaseBoard } from '../../characters'

// On a standalone page these come from the browser bundle's `tinyfly` global;
// here they come from the source modules, so the code below runs unchanged in both.
const tinyfly = { BEAN_CAST, castMember, character, drawCharacter, humanPose, HUMAN_POSES, HUMAN_EXPRESSIONS, drawRain, drawBlinds, drawDarkness, drawGlow, drawVignette, drawClueMarker, drawEvidenceFolder, drawClockFace, drawTimeChip, drawNameCard, drawNarrationBox, drawSpeechBubble, caseBoard, drawCaseBoard }

export const html = `<style>
.nc-wrap { display:grid;gap:8px;width:100%;max-width:min(960px,calc(100vw - 24px));min-width:0; }
.nc-canvas { display:block;width:100%;height:auto;aspect-ratio:16/9;background:#0d1219;border-radius:10px; }
.nc-row { display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:12px system-ui;color:#cbd5e1; }
.nc-readout { font:12px ui-monospace,monospace;color:#9bb4c7; }
</style><div class="nc-wrap">
<canvas class="nc-canvas" width="1920" height="1080"></canvas>
<div class="nc-row">
<label><input type="radio" name="nc-view" class="nc-office" checked /> the office</label>
<label><input type="radio" name="nc-view" class="nc-board" /> the case board</label>
<label><input type="checkbox" class="nc-torch" /> lights out (torch)</label>
</div><div class="nc-readout"></div></div>`

/** @param {import('../../compat/gsap').LiveApi} live @param {HTMLElement} root */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.nc-canvas')
  const ctx = canvas.getContext('2d')
  const boardView = root.querySelector('.nc-board')
  const torch = root.querySelector('.nc-torch')
  const readout = root.querySelector('.nc-readout')
  const detective = tinyfly.character(tinyfly.castMember('beanDetective', 460))
  const witness = tinyfly.character(tinyfly.castMember('beanSari', 460))
  const suspect = tinyfly.character(tinyfly.castMember('beanBoss', 200))
  const LOOP = 10000
  // Everything on the board is data: cards pinned up, red string, the marker's work, all timed in ms.
  const board = tinyfly.caseBoard({
    x: 60, y: 110, width: 1800, height: 900,
    cards: [
      { id: 'title', x: 900, y: 40, kind: 'note', title: 'WHO CUT THE ALARM?', width: 520, height: 96, angle: -1 },
      { id: 'lift', x: 900, y: 300, title: 'Lift 2', note: 'stuck at 9:40' },
      { id: 'boss', x: 330, y: 200, title: 'The secretary', note: 'wanted the chair', at: 400 },
      { id: 'guard', x: 330, y: 540, title: 'The guard', note: 'had the key', at: 700 },
      { id: 'wire', x: 1450, y: 220, kind: 'note', title: 'alarm wire: cut', at: 1400 },
      { id: 'shoes', x: 1450, y: 520, kind: 'note', title: 'wet shoes to the roof', at: 1800, highlight: { at: 6400, duration: 3000 } },
    ],
    strings: ['boss', 'guard', 'wire', 'shoes'].map((to, i) => ({ from: 'lift', to, at: 1000 + i * 400 })),
    marks: [
      { on: 'guard', kind: 'cross', at: 3200 },
      { on: 'boss', kind: 'strike', at: 4800, duration: 900 },
      { on: 'title', kind: 'scribble', at: 6000, duration: 1200 },
      { on: 'shoes', kind: 'circle', at: 7400 },
    ],
  })
  const clock = { time: 0 }
  const animation = live.to(clock, { time: LOOP, duration: LOOP / 1000, ease: 'none', repeat: -1 })

  const office = (t) => {
    ctx.fillStyle = '#232b37'
    ctx.fillRect(0, 0, 1920, 1080)
    ctx.fillStyle = '#3b4351'
    ctx.fillRect(0, 860, 1920, 220)
    // A window on the rain, and the street light coming through the blinds.
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(1500, 160, 340, 440)
    tinyfly.drawRain(ctx, t, { x: 1500, y: 160, width: 340, height: 440, drops: 60, opacity: 0.5 })
    tinyfly.drawBlinds(ctx, { x: 0, y: 0, width: 1920, height: 1080, opacity: 0.08, slope: 0.4 })
    tinyfly.drawClockFace(ctx, { x: 960, y: 200, hours: 21, minutes: 40 })
    tinyfly.drawGlow(ctx, { x: 960, y: 200, radius: 700, opacity: 0.18 })
    // The desk and the evidence on it.
    ctx.fillStyle = '#5b3a22'
    ctx.fillRect(760, 700, 420, 30)
    tinyfly.drawEvidenceFolder(ctx, { x: 900, y: 680, scale: 1.6, angle: -8 })
    const sway = Math.sin(t / 700) * 4
    ctx.save()
    ctx.translate(560, 880)
    tinyfly.drawCharacter(ctx, detective, tinyfly.humanPose({ ...tinyfly.HUMAN_POSES.think, turn: 0.45, 'head.tilt': sway }), t)
    ctx.restore()
    ctx.save()
    ctx.translate(1340, 880)
    tinyfly.drawCharacter(ctx, witness, tinyfly.humanPose({ ...tinyfly.HUMAN_EXPRESSIONS.worried, turn: -0.45 }), t)
    ctx.restore()
    if (torch.checked) {
      tinyfly.drawDarkness(ctx, { amount: 1, cones: [{ x: 640, y: 520, angle: 15 + Math.sin(t / 900) * 8, length: 760, width: 190 }], holes: [{ x: 960, y: 200, radius: 80 }] })
    }
    tinyfly.drawClueMarker(ctx, t, { x: 900, y: 680, radius: 70, at: 1500, duration: 2600 })
    tinyfly.drawSpeechBubble(ctx, t, { text: 'The lift stopped at nine forty. Who was on the stairs?', start: 3800, end: 6400, tail: { x: 560, y: 470 }, speaker: 'Detective' })
    tinyfly.drawNameCard(ctx, t, { name: 'The witness', role: 'heard footsteps', at: 6800, duration: 2600, anchor: { x: 1340, y: 470 } })
  }

  const draw = () => {
    const t = clock.time
    readout.textContent = `${boardView.checked ? 'case board' : 'office'} · ${(t / 1000).toFixed(1)} s of ${LOOP / 1000} s`
    if (!ctx) return
    if (boardView.checked) {
      ctx.fillStyle = '#0d1219'
      ctx.fillRect(0, 0, 1920, 1080)
      // Each photo card draws its suspect through drawCard, clipped to the print.
      tinyfly.drawCaseBoard(ctx, board, t, {
        drawCard: (g, card, area) => {
          if (card.kind !== 'photo') return
          g.save()
          g.translate(area.x + area.width / 2, area.y + area.height + 160)
          tinyfly.drawCharacter(g, card.id === 'lift' ? witness : suspect, tinyfly.humanPose({}), t)
          g.restore()
        },
      })
    } else office(t)
    tinyfly.drawVignette(ctx, { width: 1920, height: 1080 })
    tinyfly.drawTimeChip(ctx, t, { x: 50, y: 40, text: 'Tuesday · 9:40 PM' })
    tinyfly.drawNarrationBox(ctx, t, { text: 'It rained all night. Nobody heard the alarm, because somebody had cut it.', start: 300, end: 3400, speaker: 'Case file #1' })
  }
  draw()
  live.ticker.add(draw)
  // #endregion code
  return () => { animation.kill(); live.ticker.remove(draw) }
}

/** @type {import('./types').LiveDemo} */
export const noirCaseFile = {
  id: 'live-noir-case-file',
  name: 'Noir Case File',
  description:
    'A detective scene from the noir kit: rain on the window, street light through the blinds, a torch beam in the dark, the red clue magnifier, a speech bubble, a freeze-frame name card, a narration box and a time chip; switch to the case board, where cards are pinned up, red string stretches between them and the marker crosses out, strikes, scribbles out and rings them. Bean figures wear a trench coat and a sari with a pallu and bangles. Every frame is a pure function of time.',
  category: 'video',
  alsoIn: ['showcase'],
  tags: ['noir', 'detective', 'rain', 'blinds', 'torch', 'case board', 'clue', 'bean', 'canvas'],
  html,
  run,
}
