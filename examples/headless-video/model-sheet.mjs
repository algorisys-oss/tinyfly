/**
 * A character model sheet: a man and a woman, dressed, in five turnaround
 * views (front, 3/4, profile, 3/4 back, back), with height guides, colour
 * swatches and expressions. Render it as a still:
 *
 *   npx tinyfly video examples/headless-video/model-sheet.mjs --stills stills/
 *
 * The rendered sheet is kept in docs/model-sheet/ for reference.
 *
 * - The views are the rig's `turn` (0 front → 1 profile) and `facing`; the back
 *   views are the same figure with hair drawn over the whole head.
 * - Clothes are `style.layers`: drawing code placed at the joints the figure
 *   hands each layer, at the right depth (the shirt under the arms, hair over
 *   the head). Garments are measured square to the spine, so they lean with it.
 * - The guides come from `stickFigureJoints()`, the same numbers the figure is
 *   drawn with, and the expression close-ups centre on its `head`.
 */
import { drawStickFigure, stickFigureJoints, headPoint, taperedLine, pose, withExpression } from '@algorisys/tinyfly/characters'

const W = 1920
const H = 1080
const PAPER = '#fbf6ec'
const INK = '#2b1d16'
const GUIDE = '#c9b8a6'
const SKIN = '#f2c49b'

// ── Drawing helpers for clothes ──────────────────────────────────────────────

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** Points on a quadratic curve from `from`, pulled toward `control`, to `to`. */
const curve = (from, control, to, samples = 12) =>
  Array.from({ length: samples + 1 }, (_, k) => {
    const t = k / samples
    const u = 1 - t
    return { x: u * u * from.x + 2 * u * t * control.x + t * t * to.x, y: u * u * from.y + 2 * u * t * control.y + t * t * to.y }
  })

/** A smooth closed outline through the midpoints between `corners`: soft fabric, not a polygon. */
const rounded = (corners, samples = 6) =>
  corners.flatMap((corner, i) => {
    const from = mid(corners[(i + corners.length - 1) % corners.length], corner)
    const to = mid(corner, corners[(i + 1) % corners.length])
    return curve(from, corner, to, samples).slice(0, samples)
  })

const shape = (ctx, points, fill, outline = INK, width = 3) => {
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (const p of points.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = outline
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.stroke()
}

/** Fabric along a limb (a sleeve, a trouser leg): tapered, with an outline. */
const fabric = (ctx, points, from, to, fill) => {
  ctx.fillStyle = INK
  taperedLine(ctx, points, from + 6, to + 6)
  ctx.fillStyle = fill
  taperedLine(ctx, points, from, to)
}

/** Which way a side of the figure is on screen: its left is the far side, away from where it faces. */
const screenSide = (j, side) => (side === 'left' ? -j.facing : j.facing)

/**
 * A point on the body: `along` the spine from the hip (0) to the neck (1), or
 * below the hip when negative, and `width` (fraction of the height) out to one
 * side, square to the spine.
 */
const body = (j, along, side, width) => {
  const dx = j.neck.x - j.hip.x
  const dy = j.neck.y - j.hip.y
  const length = Math.hypot(dx, dy)
  const out = (side === 'centre' ? 0 : screenSide(j, side)) * width * j.height
  return { x: j.hip.x + dx * along - (dy / length) * out, y: j.hip.y + dy * along + (dx / length) * out }
}

/** Both sides of a garment from its right-side profile, top down: [along, width] pairs. */
const garment = (j, profile, narrow, hem) => [
  ...profile.map(([along, width]) => body(j, along, 'right', width * narrow)),
  ...hem,
  ...profile.map(([along, width]) => body(j, along, 'left', width * narrow)).reverse(),
]

const upperArm = (points, part = 0.5) => points.slice(0, Math.ceil((points.length - 1) * part) + 1)
const armOf = (j, side) => (side === 'left' ? j.limbs.leftArm : j.limbs.rightArm)

/** Hair over the whole head, for the back views. */
const hairCap = (ctx, head, color, scale = 1.07) => {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.ellipse(head.center.x, head.center.y, head.rx * scale, head.ry * scale, head.angle, 0, Math.PI * 2)
  ctx.fill()
}

/** Points around the head, from angle `a0` to `a1` (radians, 0 = right, -π/2 = top), in head units. */
const around = (head, a0, a1, radius, count, spike = 0) =>
  Array.from({ length: count + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / count
    const r = radius + (i % 2 ? spike : 0)
    return headPoint(head, Math.cos(a) * r, Math.sin(a) * r)
  })

// ── The characters ───────────────────────────────────────────────────────────

/** Each view sets how far the figure is turned, which way it faces, and whether we see its back. */
const VIEWS = [
  { label: 'FRONT', turn: 0, facing: 1, back: false },
  { label: '3/4', turn: 0.5, facing: 1, back: false },
  { label: 'PROFILE', turn: 1, facing: 1, back: false },
  { label: '3/4 BACK', turn: 0.5, facing: -1, back: true },
  { label: 'BACK', turn: 0, facing: 1, back: true },
]

const MAN = {
  name: 'TUM',
  notes: ['Male lead, early 20s', 'Half-sleeve shirt, trousers', 'Spiky hair, always a little messy'],
  height: 360,
  palette: { Shirt: '#e2493b', Trousers: '#24476b', Hair: '#1f1a17', Shoes: '#6b3f22', Skin: SKIN, Line: INK },
  layers: (view) => ({
    body: (ctx, j) => {
      const { palette } = MAN
      fabric(ctx, j.limbs.leftLeg, j.height * 0.085, j.height * 0.055, palette.Trousers)
      fabric(ctx, j.limbs.rightLeg, j.height * 0.085, j.height * 0.055, palette.Trousers)
      for (const side of ['left', 'right']) {
        // Shoes: a little longer than the foot, over the ankle.
        const ankle = j.feet[side]
        const toe = j.toes[side]
        const tip = { x: toe.x + (toe.x - ankle.x) * 0.35, y: toe.y + 1 }
        ctx.fillStyle = INK
        taperedLine(ctx, [ankle, tip], j.height * 0.05 + 4, j.height * 0.035 + 4)
        ctx.fillStyle = palette.Shoes
        taperedLine(ctx, [ankle, tip], j.height * 0.05, j.height * 0.035)
      }
      const narrow = 1 - 0.3 * view.turn
      const shirt = garment(j, [[0.98, 0.06], [0.8, 0.075], [0.4, 0.065], [-0.12, 0.078]], narrow, [body(j, -0.16, 'centre', 0)])
      shape(ctx, rounded(shirt), palette.Shirt)
      if (!view.back) {
        // Collar and button placket, shifting toward the facing side as he turns.
        const shift = 0.03 * view.turn
        ctx.strokeStyle = INK
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(body(j, 1.02, 'left', 0.035 - shift).x, body(j, 1.02, 'left', 0.035).y)
        ctx.lineTo(body(j, 0.86, 'right', shift).x, body(j, 0.86, 'right', shift).y)
        ctx.lineTo(body(j, 1.02, 'right', 0.035 + shift).x, body(j, 1.02, 'right', 0.035).y)
        ctx.moveTo(body(j, 0.86, 'right', shift).x, body(j, 0.86, 'right', shift).y)
        ctx.lineTo(body(j, -0.1, 'right', shift).x, body(j, -0.1, 'right', shift).y)
        ctx.stroke()
        ctx.fillStyle = INK
        for (const along of [0.7, 0.45, 0.2]) {
          const button = body(j, along, 'right', shift + 0.012)
          ctx.beginPath()
          ctx.arc(button.x, button.y, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
    sleeve: (ctx, j, side) => fabric(ctx, upperArm(armOf(j, side), 0.42), j.height * 0.075, j.height * 0.06, MAN.palette.Shirt),
    overHead: (ctx, j) => {
      const h = j.head
      const color = MAN.palette.Hair
      if (view.back) {
        hairCap(ctx, h, color)
        shape(ctx, around(h, Math.PI * 1.05, Math.PI * 1.95, 1.05, 12, 0.18), color, color)
        return
      }
      // Spikes over the crown, a fringe down to just above the brows.
      const crown = around(h, Math.PI * 1.02, Math.PI * 1.98, 1.04, 12, 0.2)
      crown.push(headPoint(h, h.faceX + 0.45, h.browTopY - 0.05))
      crown.push(headPoint(h, h.faceX + 0.05, h.browTopY - 0.18))
      crown.push(headPoint(h, h.faceX - 0.4, h.browTopY - 0.08))
      shape(ctx, crown, color, color)
    },
  }),
}

const WOMAN = {
  name: 'DIDI',
  notes: ['Female lead, late 20s', 'Cotton sari, pallu over the shoulder', 'Hair in a low bun, red bindi'],
  height: 340,
  palette: { Sari: '#1f9d55', Pallu: '#f4c430', Border: '#b8322a', Hair: '#1f1a17', Skin: SKIN, Line: INK },
  layers: (view) => ({
    body: (ctx, j) => {
      const { palette } = WOMAN
      const narrow = 1 - 0.3 * view.turn
      const ankle = j.feetY - j.height * 0.04
      const hem = (side, width) => ({ x: j.hip.x + screenSide(j, side) * width * j.height * narrow, y: ankle })
      // Fitted to the waist, then a flare to the ankles, with a border along the hem.
      const sari = garment(j, [[0.98, 0.055], [0.75, 0.068], [0.4, 0.052]], narrow, [
        hem('right', 0.15),
        { x: j.hip.x, y: ankle + j.height * 0.015 },
        hem('left', 0.15),
      ])
      shape(ctx, rounded(sari), palette.Sari)
      ctx.strokeStyle = palette.Border
      ctx.lineWidth = 7
      ctx.beginPath()
      const border = curve(hem('left', 0.135), { x: j.hip.x, y: ankle + j.height * 0.012 }, hem('right', 0.135))
      ctx.moveTo(border[0].x, border[0].y)
      for (const p of border) ctx.lineTo(p.x, p.y)
      ctx.stroke()
      if (!view.back) {
        // Pleats falling from the waist at the front.
        ctx.strokeStyle = '#167a42'
        ctx.lineWidth = 2.5
        for (const spread of [-0.045, 0, 0.045]) {
          const top = body(j, 0.3, 'right', spread * 0.4 + 0.02 * view.turn)
          ctx.beginPath()
          ctx.moveTo(top.x, top.y)
          ctx.quadraticCurveTo(top.x + spread * j.height * 0.5, (top.y + ankle) / 2, j.hip.x + (spread * 1.5 + 0.03 * view.turn * j.facing) * j.height, ankle - 6)
          ctx.stroke()
        }
      }
      // The pallu: across the chest from the far hip over the near shoulder in
      // front, and hanging down the back from that shoulder.
      const shoulder = j.shoulders.right
      if (view.back || view.turn === 1) {
        fabric(ctx, curve(shoulder, body(j, 0.4, 'right', 0.05), body(j, -0.55, 'right', 0.06)), j.height * 0.05, j.height * 0.075, palette.Pallu)
      }
      if (!view.back) {
        fabric(ctx, curve(shoulder, body(j, 0.6, 'centre', 0), body(j, 0.2, 'left', 0.06 * narrow)), j.height * 0.045, j.height * 0.07, palette.Pallu)
      }
    },
    sleeve: (ctx, j, side) => {
      const arm = armOf(j, side)
      fabric(ctx, upperArm(arm, 0.3), j.height * 0.07, j.height * 0.058, WOMAN.palette.Sari)
      // Bangles just above the hand.
      const wrist = arm[arm.length - 2]
      ctx.strokeStyle = WOMAN.palette.Pallu
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(wrist.x, wrist.y, j.lineWidth * 0.75, 0, Math.PI * 2)
      ctx.stroke()
    },
    behindHead: (ctx, j) => {
      if (view.back) return
      // The bun sits at the back of the head, away from the face.
      const back = view.turn === 0 ? 0.55 : -Math.sign(j.head.faceX) * 0.8
      const bun = headPoint(j.head, back, 0.35)
      ctx.fillStyle = WOMAN.palette.Hair
      ctx.beginPath()
      ctx.arc(bun.x, bun.y, j.head.rx * 0.42, 0, Math.PI * 2)
      ctx.fill()
    },
    overHead: (ctx, j) => {
      const h = j.head
      const color = WOMAN.palette.Hair
      if (view.back) {
        hairCap(ctx, h, color)
        const bun = headPoint(h, view.turn ? 0.25 * j.facing : 0, 0.5)
        ctx.beginPath()
        ctx.arc(bun.x, bun.y, h.rx * 0.45, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#3a312c'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.arc(bun.x, bun.y, h.rx * 0.25, 0.3, 4.5)
        ctx.stroke()
        return
      }
      // Parted in the middle and swept back over the ears.
      const top = around(h, Math.PI * 0.92, Math.PI * 2.08, 1.06, 14)
      top.push(headPoint(h, h.faceX + 0.45, h.browTopY - 0.05))
      top.push(headPoint(h, h.faceX, h.browTopY - 0.22))
      top.push(headPoint(h, h.faceX - 0.45, h.browTopY - 0.05))
      shape(ctx, rounded(top, 4), color, color)
      // Bindi, between the brows.
      const bindi = headPoint(h, h.faceX, h.eyeY - 0.28)
      ctx.fillStyle = '#c8102e'
      ctx.beginPath()
      ctx.arc(bindi.x, bindi.y, h.rx * 0.07, 0, Math.PI * 2)
      ctx.fill()
    },
  }),
}

/**
 * The model pose: an easy A-pose, arms a little away from the body so the
 * sleeves read. Limb angles spread sideways, and seen from the side a sideways
 * spread would show as one arm forward and one back, so it closes up as the
 * figure turns: in profile the arms hang almost straight, the far one behind
 * the body.
 */
const modelPose = (turn) => {
  const spread = 1 - 0.8 * turn
  return pose({
    leftShoulder: 16 * spread,
    rightShoulder: 16 * spread,
    leftElbow: -10 * spread,
    rightElbow: -10 * spread,
    leftHip: 5 * spread,
    rightHip: 5 * spread,
    smile: 0.5,
    turn,
  })
}

const styleFor = (character, view) => ({
  height: character.height,
  lineWidth: character.height * 0.04,
  headSize: 0.3,
  color: INK,
  headFill: SKIN,
  facing: view.facing,
  rubber: 0.3,
  shoulderWidth: 0.07,
  layers: character.layers(view),
})

// ── The sheet ────────────────────────────────────────────────────────────────

const VIEWS_X = 380
const VIEW_W = 220
const ROWS = [
  { character: MAN, ground: 505 },
  { character: WOMAN, ground: 990 },
]

function drawGuides(ctx, character, ground) {
  const front = stickFigureJoints(modelPose(0), styleFor(character, VIEWS[0]))
  const lines = [
    ['TOP', front.head.center.y - front.head.ry],
    ['CHIN', front.neck.y],
    ['SHOULDER', front.shoulders.left.y],
    ['HIP', front.hip.y],
    ['KNEE', front.knees.left.y],
    ['GROUND', front.feetY],
  ]
  const head = front.head.ry * 2
  ctx.font = '600 13px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const [label, y] of lines) {
    ctx.strokeStyle = GUIDE
    ctx.lineWidth = 1.5
    ctx.setLineDash(label === 'GROUND' ? [] : [8, 7])
    ctx.beginPath()
    ctx.moveTo(VIEWS_X - 10, ground + y)
    ctx.lineTo(VIEWS_X + VIEWS.length * VIEW_W, ground + y)
    ctx.stroke()
    ctx.fillStyle = '#9a8676'
    ctx.fillText(label, VIEWS_X - 16, ground + y)
  }
  ctx.setLineDash([])
  // Height in heads, measured beside the front view.
  ctx.fillStyle = '#9a8676'
  ctx.textAlign = 'left'
  ctx.fillText(`${(-lines[0][1] / head).toFixed(1)} heads tall`, VIEWS_X + VIEWS.length * VIEW_W + 10, ground + lines[0][1])
}

function drawCharacterInfo(ctx, character, ground) {
  const top = ground - 400
  ctx.fillStyle = INK
  ctx.font = '800 44px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(character.name, 40, top + 50)
  ctx.font = '15px sans-serif'
  ctx.fillStyle = '#6b5a4c'
  character.notes.forEach((note, i) => ctx.fillText(note, 40, top + 84 + i * 22))
  // Palette.
  Object.entries(character.palette).forEach(([name, color], i) => {
    const x = 40 + (i % 2) * 140
    const y = top + 170 + Math.floor(i / 2) * 58
    ctx.fillStyle = color
    ctx.strokeStyle = INK
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x, y, 34, 34, 8)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.font = '600 13px sans-serif'
    ctx.fillText(name, x + 42, y + 14)
    ctx.font = '12px monospace'
    ctx.fillStyle = '#6b5a4c'
    ctx.fillText(color.toUpperCase(), x + 42, y + 30)
  })
}

/** Close-ups of the face: the whole figure drawn large, centred on its head. */
function drawExpressions(ctx, character, ground) {
  const faces = ['happy', 'surprised', 'angry', 'sad']
  const x0 = 1560
  ctx.fillStyle = '#9a8676'
  ctx.font = '600 13px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('EXPRESSIONS', x0 + 160, ground - 380)
  faces.forEach((name, i) => {
    const cx = x0 + 75 + (i % 2) * 170
    const cy = ground - 290 + Math.floor(i / 2) * 175
    const figure = withExpression(modelPose(0.25), name)
    const style = styleFor(character, { ...VIEWS[0], turn: 0.25 })
    const { head } = stickFigureJoints(figure, style)
    const zoom = 1.25
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, 70, 0, Math.PI * 2)
    ctx.fillStyle = '#fffaf2'
    ctx.fill()
    ctx.strokeStyle = GUIDE
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.clip()
    ctx.translate(cx - head.center.x * zoom, cy + 10 - head.center.y * zoom)
    ctx.scale(zoom, zoom)
    drawStickFigure(ctx, figure, style)
    ctx.restore()
    ctx.fillStyle = '#6b5a4c'
    ctx.font = '13px sans-serif'
    ctx.fillText(name, cx, cy + 88)
  })
}

export default {
  width: W,
  height: H,
  fps: 30,
  duration: 1000,
  background: PAPER,
  draw(ctx) {
    ctx.fillStyle = INK
    ctx.font = '800 30px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('MODEL SHEET', 40, 50)
    ctx.font = '15px sans-serif'
    ctx.fillStyle = '#6b5a4c'
    ctx.fillText('tinyfly stick figures · turnaround · line 4% of height · head 30%', 260, 50)
    ctx.strokeStyle = INK
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(40, 66)
    ctx.lineTo(W - 40, 66)
    ctx.moveTo(40, 556)
    ctx.lineTo(W - 40, 556)
    ctx.stroke()

    for (const { character, ground } of ROWS) {
      drawCharacterInfo(ctx, character, ground)
      drawGuides(ctx, character, ground)
      VIEWS.forEach((view, i) => {
        const x = VIEWS_X + i * VIEW_W + VIEW_W / 2
        ctx.save()
        ctx.translate(x, ground)
        drawStickFigure(ctx, modelPose(view.turn), styleFor(character, view))
        ctx.restore()
        ctx.fillStyle = '#9a8676'
        ctx.font = '700 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(view.label, x, ground + 26)
      })
      drawExpressions(ctx, character, ground)
    }
  },
}
