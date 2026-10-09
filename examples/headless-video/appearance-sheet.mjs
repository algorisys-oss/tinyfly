/**
 * Characters v2, appearance: a reference sheet of the cast, every hairstyle,
 * every facial-hair style, glasses, hats and expressions. Render it as a still:
 *
 *   npx tinyfly video examples/headless-video/appearance-sheet.mjs --stills stills/
 *
 * Everything on it is plain options to character(): hair, facialHair,
 * glasses, hat, ears, build, outfit, and the face fields of a pose. Hair and
 * hats are regions on the head, so the turnaround rows show them from every
 * side without a drawing per view.
 */
import {
  character,
  drawCharacter,
  humanPose,
  castMember,
  CHARACTER_CAST,
  HAIR_STYLES,
  FACIAL_HAIR_STYLES,
  GLASSES_STYLES,
  HAT_STYLES,
  HUMAN_EXPRESSIONS,
} from '@algorisys/tinyfly/characters'

const W = 1920
const H = 1500
const PAPER = '#fbf6ec'
const INK = '#2b1d16'
const SOFT = '#9a8676'

function heading(ctx, text, x, y, size = 20) {
  ctx.fillStyle = INK
  ctx.font = `800 ${size}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(text, x, y)
}

function label(ctx, text, x, y) {
  ctx.fillStyle = SOFT
  ctx.font = '600 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}

/** A head and shoulders in a cell: the character drawn tall, clipped to the cell. */
function bust(ctx, who, pose, x, y, w, h, time) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.translate(x + w / 2, y + h * 0.52 + who.height * 0.85)
  drawCharacter(ctx, who, humanPose(pose), time)
  ctx.restore()
}

const VIEWS = [
  ['FRONT', 0],
  ['FRONT 3/4 R', 0.5],
  ['RIGHT PROFILE', 1],
  ['BACK 3/4 R', 1.5],
  ['BACK', 2],
  ['BACK 3/4 L', 2.5],
  ['LEFT PROFILE', 3],
  ['FRONT 3/4 L', 3.5],
]

function drawCast(ctx, time) {
  heading(ctx, 'CAST · castMember(name, height) · family and work', 40, 112)
  const names = Object.keys(CHARACTER_CAST)
  names.forEach((name, i) => {
    const who = character(castMember(name, 180, { seed: i + 1 }))
    const x = 64 + i * 63
    ctx.save()
    ctx.translate(x, i % 2 === 0 ? 372 : 372)
    drawCharacter(ctx, who, humanPose({ ...HUMAN_EXPRESSIONS.happy }), time)
    ctx.restore()
    label(ctx, name.toUpperCase(), x, i % 2 === 0 ? 392 : 404)
  })
  heading(ctx, 'TURNAROUND · turn 0 → 3.5', 980, 112)
  const pair = [character(castMember('youngWoman', 200)), character(castMember('grandpa', 200))]
  VIEWS.forEach(([name, turn], i) => {
    const x = 1010 + i * 110
    pair.forEach((who, k) => {
      ctx.save()
      ctx.translate(x + (k === 0 ? -24 : 26), 380)
      ctx.scale(0.72, 0.72)
      drawCharacter(ctx, who, humanPose({ turn }), time)
      ctx.restore()
    })
    label(ctx, name, x, 402)
  })
}

function drawHair(ctx, time) {
  heading(ctx, "HAIR · character({ hair: 'bob' }) · { style, color, length, … }", 40, 452)
  const names = Object.keys(HAIR_STYLES)
  const cols = 17
  names.forEach((name, i) => {
    const who = character({ height: 220, hair: name, ears: true })
    const x = 40 + (i % cols) * 108
    const y = 468 + Math.floor(i / cols) * 132
    bust(ctx, who, { turn: 0.35 }, x, y, 104, 112, time)
    label(ctx, name, x + 52, y + 124)
  })
}

function drawFacialHair(ctx, time) {
  heading(ctx, "FACIAL HAIR · character({ facialHair: 'fullBeard' }) · { moustache, beard, color }", 40, 892)
  const names = Object.keys(FACIAL_HAIR_STYLES)
  names.forEach((name, i) => {
    const who = character({ height: 220, facialHair: name, hair: 'short', ears: true })
    const x = 40 + (i % 10) * 92
    const y = 908 + Math.floor(i / 10) * 132
    bust(ctx, who, { smile: 0.3 }, x, y, 90, 112, time)
    label(ctx, name, x + 45, y + 124)
  })
}

function drawWorn(ctx, time) {
  heading(ctx, 'GLASSES AND HATS', 990, 892)
  const items = [
    ...Object.keys(GLASSES_STYLES).map((glasses) => ({ name: glasses, options: { glasses, hair: 'sidePart' } })),
    ...Object.keys(HAT_STYLES).map((hat) => ({ name: hat, options: { hat, hair: 'bob' } })),
  ]
  items.forEach(({ name, options }, i) => {
    const who = character({ height: 220, ears: true, ...options })
    const x = 990 + (i % 8) * 112
    const y = 908 + Math.floor(i / 8) * 132
    bust(ctx, who, { turn: 0.4 }, x, y, 108, 112, time)
    label(ctx, name, x + 54, y + 124)
  })
}

function drawFaces(ctx, time) {
  heading(ctx, 'EXPRESSIONS · HUMAN_EXPRESSIONS · face marks: blush, tears, sweat', 40, 1192)
  const names = Object.keys(HUMAN_EXPRESSIONS)
  const who = character({ height: 220, hair: 'wavyCrop', ears: true })
  names.forEach((name, i) => {
    const x = 40 + (i % 15) * 122
    const y = 1208 + Math.floor(i / 15) * 132
    bust(ctx, who, HUMAN_EXPRESSIONS[name], x, y, 118, 112, time)
    label(ctx, name, x + 59, y + 124)
  })
}

export default {
  width: W,
  height: H,
  fps: 24,
  duration: 1000,
  background: PAPER,
  draw(ctx, { time }) {
    heading(ctx, 'CHARACTER APPEARANCE', 40, 52, 30)
    ctx.fillStyle = SOFT
    ctx.font = '15px sans-serif'
    ctx.fillText('tinyfly characters v2 · hair, facial hair, glasses and hats are plain data on the head, so they turn with it', 460, 52)
    ctx.strokeStyle = INK
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(40, 70)
    ctx.lineTo(W - 40, 70)
    ctx.stroke()
    drawCast(ctx, time)
    drawHair(ctx, time)
    drawFacialHair(ctx, time)
    drawWorn(ctx, time)
    drawFaces(ctx, time)
  },
}
