import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import {
  COSMIC_KIT,
  COSMIC_SKIES,
  captionChunkAt,
  captionChunks,
  cosmicShade,
  depthAt,
  drawBokeh,
  drawDust,
  drawHaze,
  drawIsoCube,
  drawLabelChip,
  drawShadedBall,
  drawShortCaption,
  drawSkyGradient,
  drawZoomLevels,
  isoCubeFaces,
  levelPresence,
  parseRgb,
  zoomAt,
  zoomLevelLayout,
} from './index'
import { capabilities, capabilitiesMarkdown } from '../capabilities'

const W = 400
const H = 300

function canvas(width = W, height = H, fill = 'rgb(20,20,40)') {
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

describe('colours', () => {
  it('parses hex and rgb, and shades toward black or white', () => {
    expect(parseRgb('#f00')).toEqual([255, 0, 0])
    expect(parseRgb('rgb(10, 20, 30)')).toEqual([10, 20, 30])
    expect(cosmicShade('#808080', -1)).toBe('rgba(0,0,0,1)')
    expect(cosmicShade('#808080', 1)).toBe('rgba(255,255,255,1)')
    expect(() => parseRgb('teal')).toThrow(/cannot read the colour/)
  })
})

describe('skies and depth', () => {
  it('fills the frame with the sky preset, top colour at the top', () => {
    const { ctx, at } = canvas()
    drawSkyGradient(ctx, { width: W, height: H, sky: 'magenta' })
    const [r, g, b] = parseRgb(COSMIC_SKIES.magenta[0])
    const top = at(W / 2, 0)
    expect(Math.abs(top[0] - r) + Math.abs(top[1] - g) + Math.abs(top[2] - b)).toBeLessThan(12)
    expect(at(W / 2, H - 1)).not.toEqual(top)
  })

  it('rejects an unknown sky by name', () => {
    const { ctx } = canvas()
    expect(() => drawSkyGradient(ctx, { width: W, height: H, sky: 'mauve' as never })).toThrow(/unknown sky "mauve"/)
  })

  it('draws dust deterministically per time, and it moves with time', () => {
    const a = canvas()
    const b = canvas()
    const c = canvas()
    drawDust(a.ctx, 1000, { width: W, height: H, count: 60 })
    drawDust(b.ctx, 1000, { width: W, height: H, count: 60 })
    drawDust(c.ctx, 2500, { width: W, height: H, count: 60 })
    expect(differs(a.pixels(), b.pixels())).toBe(false)
    expect(differs(a.pixels(), c.pixels())).toBe(true)
    expect(differs(a.pixels(), canvas().pixels())).toBe(true)
  })

  it('draws bokeh discs and nothing when the count is 0', () => {
    const lit = canvas()
    drawBokeh(lit.ctx, 0, { width: W, height: H, count: 6, opacity: 0.3 })
    expect(differs(lit.pixels(), canvas().pixels())).toBe(true)
    const none = canvas()
    drawBokeh(none.ctx, 0, { width: W, height: H, count: 0 })
    expect(differs(none.pixels(), canvas().pixels())).toBe(false)
  })
})

describe('shapes', () => {
  it('shades a ball: darker away from the light, a bright highlight toward it', () => {
    const { ctx, at } = canvas()
    drawShadedBall(ctx, { x: 200, y: 150, radius: 100, color: '#f472b6' })
    const shadowSide = brightness(at(270, 220))
    const centre = brightness(at(200, 150))
    const highlight = brightness(at(200 - 0.35 * 100 * 0.5, 150 - 0.45 * 100 * 0.5))   // the highlight's centre
    expect(shadowSide).toBeLessThan(centre)
    expect(highlight).toBeGreaterThan(centre)
    expect(at(10, 10)).toEqual([20, 20, 40])
  })

  it('draws an isometric cube with a lit top and a dark right face', () => {
    const { ctx, at } = canvas()
    drawIsoCube(ctx, { x: 200, y: 160, size: 120, color: '#60a5fa' })
    const faces = isoCubeFaces({ x: 200, y: 160, size: 120 })
    const mid = (pts: [number, number][]) => [pts.reduce((s, p) => s + p[0], 0) / 4, pts.reduce((s, p) => s + p[1], 0) / 4]
    const top = brightness(at(...(mid(faces.top) as [number, number])))
    const right = brightness(at(...(mid(faces.right) as [number, number])))
    expect(top).toBeGreaterThan(right)
  })

  it('puts the haze on its ring, not in the middle', () => {
    const { ctx, pixels } = canvas()
    drawHaze(ctx, 0, { x: 200, y: 150, radius: 100, dots: 600, opacity: 1, dot: 2 })
    const d = pixels()
    const lit = (x: number, y: number) => d[(y * W + x) * 4 + 2] > 60
    let ring = 0
    let core = 0
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!lit(x, y)) continue
        const r = Math.hypot(x - 200, y - 150)
        if (r < 30) core++
        else if (r > 60 && r < 110) ring++
      }
    }
    expect(ring).toBeGreaterThan(core * 10)
  })
})

describe('zooming through scale', () => {
  it('interpolates zoom in log space: halfway between 1x and 100x is 10x', () => {
    const keys = [{ time: 0, value: 1 }, { time: 1000, value: 100 }]
    expect(zoomAt(500, keys)).toBeCloseTo(10, 6)
    expect(zoomAt(-5, keys)).toBe(1)
    expect(zoomAt(5000, keys)).toBe(100)
  })

  it('checks keys', () => {
    expect(() => depthAt(0, [])).toThrow(/at least one key/)
    expect(() => depthAt(0, [{ time: 10, value: 0 }, { time: 5, value: 1 }])).toThrow(/time order/)
    expect(() => zoomAt(0, [{ time: 0, value: 0 }])).toThrow(/> 0/)
  })

  it('lays out levels: the next one opens as a small portal, covered levels are skipped', () => {
    const start = zoomLevelLayout({ width: W, height: H, depth: 0, levelCount: 4 })
    expect(start.map((l) => l.level)).toEqual([0, 1])
    expect(start[1].portal).toBeCloseTo(520 / 14, 6)
    const deep = zoomLevelLayout({ width: W, height: H, depth: 2.4, levelCount: 4 })
    expect(deep[0].level).toBe(2)
    expect(deep.some((l) => l.level === 0)).toBe(false)
  })

  it('draws each visible level, deeper ones inside their portal', () => {
    const { ctx, at } = canvas()
    const calls: number[] = []
    const level = (n: number, color: string) => (c: CanvasRenderingContext2D) => {
      calls.push(n)
      c.fillStyle = color
      c.fillRect(-2000, -2000, 4400, 4400)
    }
    drawZoomLevels(ctx, 0, { width: W, height: H, depth: 0.6, levels: [level(0, '#ff0000'), level(1, '#00ff00'), level(2, '#0000ff')], rim: null })
    expect(calls).toEqual([0, 1, 2])
    expect(at(200, 150)).toEqual([0, 0, 255])   // the deepest portal sits at the centre
    expect(at(5, 5)).toEqual([255, 0, 0])       // the outer level fills the corners
  })

  it('reports a level’s presence', () => {
    expect(levelPresence(1.35, 1)).toBe(1)
    expect(levelPresence(3, 1)).toBe(0)
  })
})

describe('short captions and chips', () => {
  const line = { text: 'Zoom in. Skin. Cells. Molecules. Atoms.', start: 1000, end: 4000 }

  it('cuts lines into chunks at spaces, Devanagari included', () => {
    expect(captionChunks('a b c d e', 2)).toEqual(['a b', 'c d', 'e'])
    expect(captionChunks('ख़ुद को गुदगुदी कीजिए', 2)).toEqual(['ख़ुद को', 'गुदगुदी कीजिए'])
    expect(() => captionChunks('a', 0)).toThrow(/at least 1/)
  })

  it('steps through the chunks with the voice and shows nothing outside the line', () => {
    expect(captionChunkAt(line, 500)).toBeNull()
    expect(captionChunkAt(line, 1000)).toBe('Zoom in.')
    expect(captionChunkAt(line, 3990)).toBe('Molecules. Atoms.')
    expect(captionChunkAt(line, 4500)).toBeNull()
  })

  it('draws the caption in lower case and returns it', () => {
    const { ctx, pixels } = canvas()
    expect(drawShortCaption(ctx, 1000, { lines: [line], x: 200, y: 200 })).toBe('zoom in.')
    expect(differs(pixels(), canvas().pixels())).toBe(true)
    expect(drawShortCaption(canvas().ctx, 9000, { lines: [line], x: 200, y: 200 })).toBeNull()
  })

  it('pops a chip on at its time', () => {
    const { ctx } = canvas()
    expect(drawLabelChip(ctx, 0, { text: 'nucleus', x: 200, y: 100, at: 500 })).toBe(0)
    expect(drawLabelChip(ctx, 900, { text: 'nucleus', x: 200, y: 100, at: 500 })).toBeGreaterThan(0)
  })
})

describe('the catalog', () => {
  it('lists the kit and prints it', () => {
    expect(capabilities().cosmic).toBe(COSMIC_KIT)
    const md = capabilitiesMarkdown()
    expect(md).toContain('## Cosmic explainer kit')
    expect(md).toContain('drawZoomLevels')
    expect(md).toContain('soundWhoosh')
  })
})
