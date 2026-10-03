/**
 * Characters v2, milestone 1: a human construction and turnaround sheet.
 * Render it as a still:
 *
 *   npx tinyfly video examples/headless-video/human-turnaround.mjs --stills stills/
 *
 * Every figure is the same skeleton (bones in 3D, drawn as flat lines) seen
 * at `turn` 0 (front), 0.5, 1 (side), 1.5 and 2 (back): the far arm goes
 * behind the body and the face slides round and disappears on its own.
 * Rows: the traditional stick figure, the fluid figure with height guides,
 * the fluid figure dressed with layers, the same in the pencil look, and
 * silhouettes. On the right: poses that rest on knees, hands and backs
 * (contact), a hand reaching for a point, and the looks side by side.
 */
import {
  character,
  characterJoints,
  drawCharacter,
  humanPose,
  reachCharacter,
  basicOutfit,
  HUMAN_POSES,
} from '@algorisys/tinyfly/characters'

const W = 1920
const H = 1500
const PAPER = '#fbf6ec'
const INK = '#2b1d16'
const SOFT = '#9a8676'
const GUIDE = '#c9b8a6'

const VIEWS = [
  { label: 'FRONT', turn: 0 },
  { label: '3/4 FRONT', turn: 0.5 },
  { label: 'SIDE', turn: 1 },
  { label: '3/4 BACK', turn: 1.5 },
  { label: 'BACK', turn: 2 },
]
const FIGURE = 210
const VIEW_X = 300
const VIEW_W = 200

// ── Clothes as layers: drawn through the pen, so they match the look ─────────

// A T-shirt and trousers whose sleeves grow out of the shirt's shoulders.
const clothes = basicOutfit({ shirt: '#e2493b', trousers: '#24476b' })

// ── The rows ─────────────────────────────────────────────────────────────────

const ROWS = [
  { title: 'STICK', note: 'figure: stick', who: character({ height: FIGURE, figure: 'stick', ink: INK }) },
  { title: 'FLUID (BARE)', note: 'figure: fluid', who: character({ height: FIGURE, ink: INK, skin: '#ffffff' }), guides: true },
  { title: 'CLOTHED', note: 'layers on parts', who: character({ height: FIGURE, ink: INK, skin: '#f2c49b', layers: clothes }) },
  { title: 'PENCIL', note: "look: 'pencil'", who: character({ height: FIGURE, look: 'pencil', seed: 4, layers: clothes, skin: '#f7ecdc' }) },
  { title: 'SILHOUETTE', note: "look: 'silhouette'", who: character({ height: FIGURE, look: 'silhouette', ink: '#111111' }) },
]
const ROW_H = 272
const TOP = 120

function drawGuides(ctx, who, ground) {
  const j = characterJoints(who, humanPose({ turn: 0 }))
  const lines = [
    ['HEAD', j.head.center.y - j.head.ry],
    ['CHIN', j.chains.neck[1].y],
    ['SHOULDERS', j.points['shoulder.left'].y],
    ['HIPS', j.points.hip.y],
    ['KNEES', j.points['knee.left'].y],
    ['FEET', j.groundY],
  ]
  ctx.font = '600 12px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const [label, y] of lines) {
    ctx.strokeStyle = GUIDE
    ctx.lineWidth = 1.2
    ctx.setLineDash(label === 'FEET' ? [] : [6, 6])
    ctx.beginPath()
    ctx.moveTo(VIEW_X - 6, ground + y)
    ctx.lineTo(VIEW_X + VIEWS.length * VIEW_W, ground + y)
    ctx.stroke()
    ctx.fillStyle = SOFT
    ctx.fillText(label, VIEW_X - 12, ground + y)
  }
  ctx.setLineDash([])
}

function heading(ctx, text, x, y, size = 15) {
  ctx.fillStyle = INK
  ctx.font = `800 ${size}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x, y)
}

function label(ctx, text, x, y) {
  ctx.fillStyle = SOFT
  ctx.font = '600 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, x, y)
}

// ── Right-hand panels ────────────────────────────────────────────────────────

const PANEL_X = 1360

function drawContact(ctx, time) {
  heading(ctx, 'CONTACT', PANEL_X, TOP - 30)
  label(ctx, 'the lowest point rests on the ground', PANEL_X + 250, TOP - 12)
  const who = character({ height: 160, ink: INK, skin: '#ffffff' })
  const poses = [
    ['sit', HUMAN_POSES.sit],
    ['kneel', HUMAN_POSES.kneel],
    ['crouch', HUMAN_POSES.crouch],
    ['crawl', HUMAN_POSES.crawl],
    ['jump (lift)', { ...HUMAN_POSES.cheer, lift: 0.25, 'leg.left.knee': 40, 'leg.right.knee': 40 }],
    ['lie down', HUMAN_POSES.lieDown],
  ]
  poses.forEach(([name, pose], i) => {
    const x = PANEL_X + 90 + (i % 3) * 175
    const ground = TOP + 190 + Math.floor(i / 3) * 230
    ctx.strokeStyle = GUIDE
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x - 80, ground)
    ctx.lineTo(x + 80, ground)
    ctx.stroke()
    ctx.save()
    // Lying down, the figure stretches out to the right of its hips.
    ctx.translate(name === 'lie down' ? x - 75 : x, ground)
    drawCharacter(ctx, who, { ...pose, turn: name.startsWith('jump') ? 0 : 1 }, time)
    ctx.restore()
    label(ctx, name.toUpperCase(), name === 'lie down' ? x - 30 : x, ground + 22)
  })
}

function drawReach(ctx, time) {
  const top = TOP + 520
  heading(ctx, 'REACH', PANEL_X, top)
  label(ctx, 'reachCharacter(): the hand lands on the point', PANEL_X + 270, top + 18)
  const who = character({ height: 170, ink: INK, skin: '#ffffff' })
  const ground = top + 230
  // Points within arm's reach of the shoulder (about a third of the height away).
  const targets = [
    { turn: 0.5, at: { x: 38, y: -128 } },
    { turn: 1, at: { x: 48, y: -88 } },
    { turn: 1, at: { x: 22, y: -150 } },
  ]
  targets.forEach(({ turn, at }, i) => {
    const x = PANEL_X + 70 + i * 175
    const pose = reachCharacter(who, humanPose({ turn }), 'arm.right', { ...at })
    ctx.save()
    ctx.translate(x, ground)
    drawCharacter(ctx, who, pose, time)
    ctx.fillStyle = '#e2493b'
    ctx.beginPath()
    ctx.arc(at.x, at.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
}

function drawLooks(ctx, time) {
  const top = TOP + 830
  heading(ctx, 'ONE POSE, EVERY LOOK', PANEL_X, top)
  const ground = top + 230
  const pose = { ...HUMAN_POSES.wave, turn: 0.35 }
  const looks = [
    ['stick', character({ height: 170, figure: 'stick', ink: INK })],
    ['fluid', character({ height: 170, ink: INK })],
    ['pencil', character({ height: 170, look: 'pencil', figure: 'stick', seed: 9 })],
    ['thin', character({ height: 170, ink: INK, proportions: 'thin' })],
  ]
  looks.forEach(([name, who], i) => {
    const x = PANEL_X + 60 + i * 135
    ctx.save()
    ctx.translate(x, ground)
    drawCharacter(ctx, who, pose, time)
    ctx.restore()
    label(ctx, name.toUpperCase(), x, ground + 22)
  })
}

export default {
  width: W,
  height: H,
  fps: 24,
  duration: 1000,
  background: PAPER,
  draw(ctx, { time }) {
    heading(ctx, 'HUMAN CONSTRUCTION & TURNAROUND', 40, 52, 30)
    ctx.fillStyle = SOFT
    ctx.font = '15px sans-serif'
    ctx.fillText('tinyfly characters v2 · one skeleton in 3D, drawn flat · bold proportions (head 30%, line 4.5%)', 640, 52)
    ctx.strokeStyle = INK
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(40, 70)
    ctx.lineTo(W - 40, 70)
    ctx.moveTo(PANEL_X - 40, 90)
    ctx.lineTo(PANEL_X - 40, H - 40)
    ctx.stroke()

    ROWS.forEach((row, r) => {
      const ground = TOP + 230 + r * ROW_H
      heading(ctx, row.title, 40, ground - 150)
      ctx.fillStyle = SOFT
      ctx.font = '13px monospace'
      ctx.fillText(row.note, 40, ground - 128)
      if (row.guides) drawGuides(ctx, row.who, ground)
      VIEWS.forEach((view, i) => {
        const x = VIEW_X + i * VIEW_W + VIEW_W / 2
        ctx.save()
        ctx.translate(x, ground)
        drawCharacter(ctx, row.who, humanPose({ turn: view.turn }), time)
        ctx.restore()
        if (r === ROWS.length - 1 || r === 0) label(ctx, view.label, x, ground + 24)
      })
    })

    drawContact(ctx, time)
    drawReach(ctx, time)
    drawLooks(ctx, time)
  },
}
