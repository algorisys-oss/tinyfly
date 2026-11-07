import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import {
  caseBoard,
  caseBoardMarkerTip,
  caseCardBox,
  caseMarkPath,
  clockHandAngles,
  clueMarkerAt,
  coneCorners,
  drawBlinds,
  drawCaseBoard,
  drawClockFace,
  drawClueMarker,
  drawDarkness,
  drawEvidenceFolder,
  drawGlow,
  drawNameCard,
  drawNarrationBox,
  drawRain,
  drawSpeechBubble,
  drawTimeChip,
  drawVignette,
  lightFlicker,
  lightningFlash,
  lineReveal,
  NOIR_KIT,
} from './index'
import { fadeWindow, withAlpha, wrapText } from './noir-utils'
import { capabilities, capabilitiesMarkdown } from '../capabilities'

const W = 400
const H = 300

/** A grey canvas; returns its context, a pixel reader and a whole-image snapshot. */
function canvas(width = W, height = H, fill = 'rgb(128,128,128)') {
  const c = createCanvas(width, height)
  const ctx = c.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, width, height)
  const pixels = () => c.getContext('2d').getImageData(0, 0, width, height).data
  const at = (x: number, y: number) => {
    const d = pixels()
    const i = (Math.round(y) * width + Math.round(x)) * 4
    return [d[i], d[i + 1], d[i + 2]]
  }
  return { ctx, at, pixels }
}
const brightness = ([r, g, b]: number[]) => (r + g + b) / 3
const differs = (a: Uint8ClampedArray, b: Uint8ClampedArray) => a.some((v, i) => v !== b[i])

describe('noir utilities', () => {
  it('fades a window in and out, and is 0 outside it', () => {
    expect(fadeWindow(-1, 0, 1000)).toBe(0)
    expect(fadeWindow(1001, 0, 1000)).toBe(0)
    expect(fadeWindow(500, 0, 1000)).toBe(1)
    expect(fadeWindow(150, 0, 1000)).toBeGreaterThan(0)
    expect(fadeWindow(150, 0, 1000)).toBeLessThan(1)
  })

  it('adds an alpha to hex and rgb colours', () => {
    expect(withAlpha('#fff', 0.5)).toBe('rgba(255,255,255,0.5)')
    expect(withAlpha('#d7263d', 1)).toBe('rgba(215,38,61,1)')
    expect(withAlpha('rgb(1, 2, 3)', 0.25)).toBe('rgba(1,2,3,0.25)')
    expect(withAlpha('rgba(1,2,3,0.5)', 0.5)).toBe('rgba(1,2,3,0.25)')
  })

  it('wraps text at spaces within a width (any script), keeping explicit breaks', () => {
    const { ctx } = canvas()
    ctx.font = '20px sans-serif'
    const lines = wrapText(ctx, 'one two three four five six seven eight nine ten', 120)
    expect(lines.length).toBeGreaterThan(2)
    for (const l of lines) expect(ctx.measureText(l).width).toBeLessThanOrEqual(120)
    expect(lines.join(' ')).toBe('one two three four five six seven eight nine ten')
    expect(wrapText(ctx, 'a\nb', 500)).toEqual(['a', 'b'])
    expect(wrapText(ctx, 'नीरा ने बारिश में देखा', 60).join(' ')).toBe('नीरा ने बारिश में देखा')
  })
})

describe('noir atmosphere', () => {
  it('rains only inside its box, the same at the same time and moving over time', () => {
    const draw = (time: number) => {
      const c = canvas(W, H, 'rgb(0,0,0)')
      drawRain(c.ctx, time, { x: 100, y: 50, width: 200, height: 200, drops: 80, opacity: 1, color: '#ffffff' })
      return c
    }
    const a = draw(1000)
    const b = draw(1000)
    const later = draw(1250)
    expect(differs(a.pixels(), b.pixels())).toBe(false)
    expect(differs(a.pixels(), later.pixels())).toBe(true)
    // Nothing outside the box.
    const d = a.pixels()
    let outside = 0
    let inside = 0
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const lit = d[(y * W + x) * 4] > 20
      const inBox = x >= 100 && x < 300 && y >= 50 && y < 250
      if (lit && !inBox) outside++
      if (lit && inBox) inside++
    }
    expect(outside).toBe(0)
    expect(inside).toBeGreaterThan(200)
  })

  it('different seeds put the drops in different places', () => {
    const one = canvas(W, H, 'rgb(0,0,0)')
    const two = canvas(W, H, 'rgb(0,0,0)')
    drawRain(one.ctx, 0, { x: 0, y: 0, width: W, height: H, seed: 1, opacity: 1 })
    drawRain(two.ctx, 0, { x: 0, y: 0, width: W, height: H, seed: 2, opacity: 1 })
    expect(differs(one.pixels(), two.pixels())).toBe(true)
  })

  it('lights slanted bands through blinds, inside the box only', () => {
    const { ctx, at } = canvas(W, H, 'rgb(0,0,0)')
    drawBlinds(ctx, { x: 0, y: 0, width: 200, height: H, opacity: 1, slope: 0, spacing: 40, band: 20, color: '#ffffff' })
    // Flat bands every 40 px, 20 px thick: on, off, on down a column.
    expect(brightness(at(100, 10))).toBeGreaterThan(200)
    expect(brightness(at(100, 30))).toBeLessThan(20)
    expect(brightness(at(100, 50))).toBeGreaterThan(200)
    expect(brightness(at(300, 10))).toBeLessThan(20)
  })

  it('darkens everything but the torch beam and the holes', () => {
    const { ctx, at } = canvas(W, H, 'rgb(200,200,200)')
    const cone = { x: 20, y: 150, angle: 0, length: 200, width: 60 }
    drawDarkness(ctx, { amount: 1, cones: [cone], holes: [{ x: 330, y: 60, radius: 30 }], beam: null })
    expect(brightness(at(330, 250))).toBeLessThan(40) // in the dark
    expect(brightness(at(330, 60))).toBeGreaterThan(190) // in the hole
    const inBeam = brightness(at(180, 150))
    expect(inBeam).toBeGreaterThan(100) // in the beam: only a little dimmed
    expect(inBeam).toBeLessThan(200)
    // The beam's corners: the apex, then the far end either side of its axis.
    const [apex, b, c] = coneCorners(cone)
    expect(apex).toEqual({ x: 20, y: 150 })
    expect(b.x).toBeCloseTo(220)
    expect(Math.abs(b.y - c.y)).toBeCloseTo(120)
  })

  it('draws nothing for no darkness', () => {
    const { ctx, pixels } = canvas()
    const before = pixels()
    drawDarkness(ctx, { amount: 0, cones: [] })
    expect(differs(before, pixels())).toBe(false)
  })

  it('glows brightest at the centre and fades to nothing at the radius', () => {
    const { ctx, at } = canvas(W, H, 'rgb(0,0,0)')
    drawGlow(ctx, { x: 200, y: 150, radius: 100, color: '#ffffff', opacity: 1 })
    expect(brightness(at(200, 150))).toBeGreaterThan(240)
    expect(brightness(at(250, 150))).toBeGreaterThan(brightness(at(290, 150)))
    expect(brightness(at(200, 260))).toBe(0)
  })

  it('darkens the corners more than the middle', () => {
    const { ctx, at } = canvas(W, H, 'rgb(200,200,200)')
    drawVignette(ctx, { width: W, height: H })
    expect(brightness(at(200, 150))).toBeGreaterThan(195)
    expect(brightness(at(2, 2))).toBeLessThan(120)
  })

  it('flashes lightning at strikes and flickers a bulb repeatably', () => {
    expect(lightningFlash(500, [500])).toBe(1)
    expect(lightningFlash(585, [500])).toBeCloseTo(0.5, 1)
    expect(lightningFlash(2000, [500])).toBe(0)
    const flicker = Array.from({ length: 40 }, (_, i) => lightFlicker(i * 37))
    expect(flicker).toEqual(Array.from({ length: 40 }, (_, i) => lightFlicker(i * 37)))
    expect(new Set(flicker)).toEqual(new Set([0, 0.18]))
  })
})

describe('detective overlays', () => {
  it('pops the clue marker on, pulses it, fades it out, and shows nothing outside its window', () => {
    expect(clueMarkerAt(900, { at: 1000 }).opacity).toBe(0)
    expect(clueMarkerAt(1100, { at: 1000 }).opacity).toBeGreaterThan(0)
    expect(clueMarkerAt(2000, { at: 1000 }).opacity).toBe(1)
    expect(clueMarkerAt(3900, { at: 1000 }).opacity).toBeLessThan(0.5)
    expect(clueMarkerAt(4100, { at: 1000 }).opacity).toBe(0)
    const { ctx, at, pixels } = canvas()
    const before = pixels()
    expect(drawClueMarker(ctx, 500, { x: 200, y: 150, at: 1000 })).toBe(0)
    expect(differs(before, pixels())).toBe(false)
    drawClueMarker(ctx, 2000, { x: 150, y: 120, at: 1000, radius: 50 })
    // The red ring passes left of the centre; the middle stays clear.
    const ring = clueMarkerAt(2000, { at: 1000 }).scale * 50
    const [r, g, b] = at(150 - ring, 120)
    expect(r).toBeGreaterThan(150)
    expect(g).toBeLessThan(90)
    expect(b).toBeLessThan(110)
    expect(at(150, 120)).toEqual([128, 128, 128])
  })

  it('draws a folder and a clock whose hands show the time', () => {
    const { ctx, at } = canvas()
    drawEvidenceFolder(ctx, { x: 80, y: 80, scale: 2 })
    expect(at(80, 100)[0]).toBeGreaterThan(150)
    const { hour, minute } = clockHandAngles(21, 30)
    expect(minute).toBeCloseTo(Math.PI)
    expect(hour).toBeCloseTo(((9.5) / 12) * Math.PI * 2)
    drawClockFace(ctx, { x: 300, y: 150, radius: 60, hours: 3, minutes: 0 })
    // At 3:00 the minute hand points up, the hour hand right; down and left of centre are face.
    expect(brightness(at(300, 150 - 30))).toBeLessThan(60)
    expect(brightness(at(300 + 20, 150))).toBeLessThan(60)
    expect(brightness(at(300, 150 + 30))).toBeGreaterThan(200)
    expect(brightness(at(300 - 20, 150))).toBeGreaterThan(200)
  })

  it('sizes the time chip to its text and fades it in', () => {
    const { ctx } = canvas()
    const short = drawTimeChip(ctx, 1000, { x: 10, y: 10, text: '9:40' })
    const long = drawTimeChip(ctx, 1000, { x: 10, y: 80, text: 'Tuesday · 9:40 PM' })
    expect(long).toBeGreaterThan(short)
    const fresh = canvas()
    const before = fresh.pixels()
    drawTimeChip(fresh.ctx, 0, { x: 10, y: 10, text: '9:40', at: 100 })
    expect(differs(before, fresh.pixels())).toBe(false)
  })

  it('dims the frame for a name card beside the head, on the side with room', () => {
    const { ctx, at } = canvas(W, H)
    const k = drawNameCard(ctx, 1500, { name: 'Rekha', role: 'the neighbour', at: 1000, duration: 2000, anchor: { x: 60, y: 100 }, frame: { width: W, height: H }, nameSize: 24, roleSize: 12 })
    expect(k).toBe(1)
    expect(brightness(at(5, 290))).toBeLessThan(100) // dimmed
    // A head on the left gets the card on its right.
    const right = at(60 + 24 * 2.2 + 30, 100)
    expect(right[0]).toBeGreaterThan(150)
    expect(right[1]).toBeLessThan(80)
    const other = canvas(W, H)
    drawNameCard(other.ctx, 1500, { name: 'Rekha', at: 1000, anchor: { x: 360, y: 100 }, frame: { width: W, height: H }, nameSize: 24, dim: 0 })
    const left = other.at(360 - 24 * 2.2 - 30, 100)
    expect(left[0]).toBeGreaterThan(150)
    expect(other.at(5, 290)).toEqual([128, 128, 128]) // dim: 0
    expect(drawNameCard(other.ctx, 5000, { name: 'Rekha', at: 1000, anchor: { x: 0, y: 0 } })).toBe(0)
  })

  it('types narration on word by word over its line', () => {
    expect(lineReveal(900, 1000, 3000).opacity).toBe(0)
    expect(lineReveal(1500, 1000, 3000).reveal).toBeCloseTo(0.5)
    expect(lineReveal(2500, 1000, 3000).reveal).toBe(1)
    const early = canvas(800, 300)
    const late = canvas(800, 300)
    const box = { text: 'It was raining the night he did not come home', start: 1000, end: 4000, speaker: 'Neera', x: 20, width: 760, bottom: 290, size: 28 }
    drawNarrationBox(early.ctx, 1200, box)
    drawNarrationBox(late.ctx, 3000, box)
    const inkIn = (c: ReturnType<typeof canvas>) => {
      const d = c.pixels()
      let n = 0
      for (let i = 0; i < d.length; i += 4) if (d[i] < 60 && d[i + 1] < 60) n++
      return n
    }
    expect(inkIn(late)).toBeGreaterThan(inkIn(early))
  })

  it('puts a speech bubble above the head, inside the frame, and pops it away after its line', () => {
    const { ctx, at } = canvas(W, H)
    const k = drawSpeechBubble(ctx, 1500, { text: 'Who was it?', start: 1000, end: 3000, tail: { x: 380, y: 260 }, size: 20, bounds: { x: 10, y: 10, width: W - 20, height: H - 20 } })
    expect(k).toBe(1)
    // The bubble is pushed left to fit; white above the head, clear below it.
    let white = 0
    for (let x = 200; x < 390; x += 4) if (brightness(at(x, 165)) > 250) white++
    expect(white).toBeGreaterThan(5)
    expect(at(200, 290)).toEqual([128, 128, 128])
    expect(drawSpeechBubble(ctx, 4000, { text: 'x', start: 1000, end: 3000, tail: { x: 200, y: 200 } })).toBe(0)
  })
})

describe('case board', () => {
  const board = () =>
    caseBoard({
      x: 0,
      y: 0,
      width: 800,
      height: 500,
      cards: [
        { id: 'victim', x: 400, y: 60, title: 'Victim', angle: 0 },
        { id: 'aunt', x: 150, y: 60, title: 'Aunt', angle: 0, at: 500 },
        { id: 'wire', x: 650, y: 60, kind: 'note', title: 'wire: cut', angle: 0, at: 800 },
      ],
      strings: [{ from: 'victim', to: 'aunt', at: 1000, duration: 500 }],
      marks: [{ on: 'aunt', kind: 'cross', at: 2000, duration: 1000 }, { on: 'wire', kind: 'scribble', at: 4000, duration: 1000 }],
    })

  it('resolves every default and seeds the tilts', () => {
    const b = caseBoard({ x: 0, y: 0, width: 100, height: 100, cards: [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 0, y: 0, kind: 'note' }] })
    expect(b.cards[0]).toMatchObject({ kind: 'photo', width: 220, height: 260, at: 0, color: '#f5f1e8' })
    expect(b.cards[1]).toMatchObject({ kind: 'note', height: 124, color: '#fef08a' })
    expect(Math.abs(b.cards[0].angle)).toBeLessThanOrEqual(3)
    expect(caseBoard({ x: 0, y: 0, width: 100, height: 100, cards: [{ id: 'a', x: 0, y: 0 }] }).cards[0].angle).toBe(b.cards[0].angle)
  })

  it('names unknown cards and kinds with a suggestion', () => {
    expect(() => caseBoard({ x: 0, y: 0, width: 1, height: 1, cards: [{ id: 'aunt', x: 0, y: 0 }], strings: [{ from: 'aunty', to: 'aunt' }] })).toThrow(/did you mean "aunt"/)
    expect(() => caseBoard({ x: 0, y: 0, width: 1, height: 1, cards: [{ id: 'aunt', x: 0, y: 0 }], marks: [{ on: 'aunt', kind: 'crossout' as never, at: 0 }] })).toThrow(/did you mean "cross"/)
    expect(() => caseBoard({ x: 0, y: 0, width: 1, height: 1, cards: [{ id: 'a', x: 0, y: 0 }, { id: 'a', x: 0, y: 0 }] })).toThrow(/two cards/)
  })

  it('finds a card on the board and lays a cross over it corner to corner', () => {
    const b = board()
    const box = caseCardBox(b, 'aunt')
    expect(box.pin).toEqual({ x: 150, y: 60 })
    expect(box.center).toEqual({ x: 150, y: 190 })
    const [first, second] = caseMarkPath(b, { on: 'aunt', kind: 'cross' })
    expect(first[0].x).toBeLessThan(150)
    expect(first[1].x).toBeGreaterThan(150)
    expect(second[0].x).toBeGreaterThan(150)
    expect(caseMarkPath(b, { on: 'wire', kind: 'scribble' })[0]).toHaveLength(15)
  })

  it('moves the marker nib along a mark while it is drawn, and has none otherwise', () => {
    const b = board()
    expect(caseBoardMarkerTip(b, 1900)).toBeNull()
    const early = caseBoardMarkerTip(b, 2200)!
    const later = caseBoardMarkerTip(b, 2450)!
    expect(later.x).toBeGreaterThan(early.x) // the first stroke runs left to right
    const secondStroke = caseBoardMarkerTip(b, 2800)!
    expect(secondStroke.x).toBeLessThan(later.x + 200)
    expect(caseBoardMarkerTip(b, 3100)).toBeNull()
  })

  it('pins cards up at their times, stretches the string, and draws the marks on', () => {
    const b = board()
    const frame = (time: number) => {
      const c = canvas(800, 500, 'rgb(0,0,0)')
      const tip = drawCaseBoard(c.ctx, b, time)
      return { ...c, tip }
    }
    const before = frame(100)
    // The aunt's card is not up yet: cork where it will be.
    expect(before.at(150, 300)[2]).toBeLessThan(100)
    const up = frame(900)
    expect(brightness(up.at(150, 300))).toBeGreaterThan(200)
    // The string reaches halfway at mid-stretch, all the way after.
    const red = ([r, g, b]: number[]) => r > 140 && g < 60 && b < 90
    const mid = frame(1250)
    expect(red(mid.at(285, 60))).toBe(true)
    expect(red(mid.at(266, 60))).toBe(false)
    expect(red(frame(1600).at(266, 60))).toBe(true)
    // The cross: halfway through, the first diagonal is done, the second not begun; after, both.
    const crossing = frame(2500)
    expect(crossing.tip).not.toBeNull()
    const [a, c] = caseMarkPath(b, { on: 'aunt', kind: 'cross' })
    const onA = { x: (a[0].x + a[1].x) / 2 + 30, y: (a[0].y + a[1].y) / 2 + 30 * ((a[1].y - a[0].y) / (a[1].x - a[0].x)) }
    expect(red(crossing.at(onA.x, onA.y))).toBe(true)
    const onC = { x: (c[0].x + c[1].x) / 2 - 30, y: (c[0].y + c[1].y) / 2 - 30 * ((c[1].y - c[0].y) / (c[1].x - c[0].x)) }
    expect(red(crossing.at(onC.x, onC.y))).toBe(false)
    const done = frame(3500)
    expect(done.tip).toBeNull()
    expect(red(done.at(onC.x, onC.y))).toBe(true)
  })

  it('draws a card picture through drawCard, clipped to the picture area', () => {
    const b = board()
    const c = canvas(800, 500, 'rgb(0,0,0)')
    const areas: string[] = []
    drawCaseBoard(c.ctx, b, 5000, {
      drawCard: (ctx, card, area) => {
        areas.push(card.id)
        ctx.fillStyle = '#00ff00'
        ctx.fillRect(-1000, -1000, 2000, 2000)
        expect(area.width).toBeGreaterThan(0)
      },
    })
    expect(areas).toEqual(['victim', 'aunt', 'wire'])
    // Green inside the victim's photo area, never outside the card.
    expect(c.at(400, 120)[1]).toBeGreaterThan(200)
    expect(c.at(400, 340)[1]).toBeLessThan(200)
  })

  it('is the same at the same time', () => {
    const b = board()
    const one = canvas(800, 500)
    const two = canvas(800, 500)
    drawCaseBoard(one.ctx, b, 2600)
    drawCaseBoard(two.ctx, b, 2600)
    expect(differs(one.pixels(), two.pixels())).toBe(false)
  })
})

describe('noir catalog', () => {
  it('lists the kit in the capabilities catalog and its markdown', () => {
    const c = capabilities()
    expect(c.noir).toBe(NOIR_KIT)
    expect(Object.keys(c.noir.markKinds)).toEqual(['cross', 'strike', 'scribble', 'circle'])
    const md = capabilitiesMarkdown()
    expect(md).toContain('## Noir / detective kit')
    for (const name of ['drawRain', 'drawBlinds', 'drawDarkness', 'drawGlow', 'drawVignette', 'drawClueMarker', 'drawEvidenceFolder', 'drawClockFace', 'drawTimeChip', 'drawNameCard', 'drawNarrationBox', 'drawSpeechBubble', 'caseBoard', 'drawCaseBoard', 'caseBoardMarkerTip']) {
      expect(md).toContain(`\`${name}(`)
    }
  })
})
