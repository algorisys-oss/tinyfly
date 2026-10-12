import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { MANGA_CAST, castMember } from './cast'
import { character, characterJoints, drawCharacterHead, type CharacterOptions } from './character'
import { humanPose, HUMAN_EXPRESSIONS } from './species/human'
import type { Pose } from './rig/body-plan'
import { angularHeadOutline } from './head/head-shape'

const render = (options: CharacterOptions, pose: Pose = {}) => {
  const canvas = createCanvas(300, 320)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  drawCharacterHead(ctx, character(options), humanPose(pose), { x: 150, y: 170, radius: 80 })
  return canvas.toBuffer('image/png')
}

describe('young adult manga cast', () => {
  it('projects a genuine angular head with adjustable jaw and chin widths', () => {
    const head = characterJoints(character(), humanPose({})).head
    const outline = angularHeadOutline(head, { jawWidth: 0.78, chinWidth: 0.16 })
    const jaw = outline.filter(p => Math.abs(p.y - head.center.y - head.ry * 0.5) < 0.001)
    expect(jaw).toHaveLength(2)
    expect(Math.abs(jaw[0].x - head.center.x) / head.rx).toBeCloseTo(0.78)
    const chin = outline.filter(p => Math.abs(p.y - head.center.y - head.ry * 0.92) < 0.001)
    expect(chin).toHaveLength(2)
    expect(Math.abs(chin[0].x - head.center.x) / head.rx).toBeCloseTo(0.16)
    const options: CharacterOptions = { face: { shape: 'angular' } }
    const baseline = render(options)
    expect(baseline.equals(render({ face: { shape: 'round' } }))).toBe(false)
    expect(baseline.equals(render({ face: { shape: 'angular', jawWidth: 0.9, chinWidth: 0.3 } }))).toBe(false)
  })

  it('keeps the silhouette finite through combined turn, nod and roll and full revolutions', () => {
    const who = character(castMember('mangaYoungMan', 300))
    for (const turn of [0, 0.5, 1, 1.5, 2, 3, 4]) {
      const head = characterJoints(who, humanPose({ turn, 'head.nod': 24, 'head.tilt': -16, roll: 30 })).head
      const outline = angularHeadOutline(head, who.face)
      expect(outline.length).toBeGreaterThan(5)
      expect(outline.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
    }
    const start = characterJoints(who, humanPose({ turn: 0 })).head
    const end = characterJoints(who, humanPose({ turn: 4 })).head
    const a = angularHeadOutline(start, who.face)
    const b = angularHeadOutline(end, who.face)
    for (const p of a) expect(Math.min(...b.map(q => Math.hypot(p.x - q.x, p.y - q.y)))).toBeLessThan(1e-8)
  })

  it('rounds angular corners without changing existing sharp faces', () => {
    const who = character({ face: { shape: 'angular', jawWidth: 0.8, chinWidth: 0.28, jawRoundness: 1 } })
    expect(JSON.parse(JSON.stringify(who.face)).jawRoundness).toBe(1)
    const cornerAngle = (points: Array<{ x: number; y: number }>) => Math.max(...points.map((point, i) => {
      const before = points[(i + points.length - 1) % points.length]
      const after = points[(i + 1) % points.length]
      const a = [point.x - before.x, point.y - before.y]
      const b = [after.x - point.x, after.y - point.y]
      const cosine = (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))
      return Math.acos(Math.min(1, Math.max(-1, cosine)))
    }))
    for (const turn of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) {
      const head = characterJoints(who, humanPose({ turn, 'head.nod': 12, 'head.tilt': -8 })).head
      const sharp = angularHeadOutline(head, { jawWidth: 0.8, chinWidth: 0.28 })
      expect(angularHeadOutline(head, { jawWidth: 0.8, chinWidth: 0.28, jawRoundness: 0 })).toEqual(sharp)
      const rounded = angularHeadOutline(head, who.face)
      expect(rounded.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
      expect(cornerAngle(rounded)).toBeLessThan(cornerAngle(sharp))
      expect(angularHeadOutline(head, JSON.parse(JSON.stringify(who.face)))).toEqual(rounded)
    }
  })

  it.each([0, 1])('fills hair next to the angular chin without an oval clipping gap (roundness %s)', jawRoundness => {
    const canvas = createCanvas(300, 320)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 300, 320)
    const who = character({ skin: '#f2cfb1', ink: '#342b32', lineWidth: 2.2, look: 'clean',
      face: { shape: 'angular', jawWidth: 0.8, chinWidth: 0.28, jawRoundness },
      hair: { style: 'cascadingWaves', color: '#985b32' },
    })
    drawCharacterHead(ctx as unknown as CanvasRenderingContext2D, who, humanPose({}), { x: 150, y: 170, radius: 80 })
    // These points lie beside the jaw, inside the former oval mask.
    for (const x of [110, 190]) expect([...ctx.getImageData(x, 234, 1, 1).data]).toEqual([152, 91, 50, 255])
  })

  it('renders each editable JSON preset through views and expressions in all pen looks', () => {
    expect(Object.keys(MANGA_CAST)).toHaveLength(4)
    for (const name of Object.keys(MANGA_CAST) as Array<keyof typeof MANGA_CAST>) {
      const options = castMember(name, 300)
      const saved = JSON.parse(JSON.stringify(options))
      expect(saved).toEqual(options)
      for (const look of ['clean', 'pencil', 'silhouette'] as const) {
        for (const turn of [0, 0.5, 1, 2, 3]) {
          const pose = { ...HUMAN_EXPRESSIONS.determined, turn, 'head.nod': 12 }
          expect(render({ ...saved, look }, pose).equals(render({ ...options, look }, pose))).toBe(true)
        }
      }
    }
  }, 20000)

  it('changes hair independently of the face and retains shared expression and gaze controls', () => {
    const preset = castMember('mangaYoungWoman', 300)
    const bob = castMember('mangaYoungWoman', 300, { hair: { style: 'bob', color: '#4488aa' } })
    expect(bob.face).toEqual(preset.face)
    expect(render(bob).equals(render(preset))).toBe(false)
    const neutral = render(preset)
    for (const pose of [HUMAN_EXPRESSIONS.surprised, HUMAN_EXPRESSIONS.crying, { blink: 1 }, { lookX: 1, lookY: -1 }]) {
      expect(render(preset, pose).equals(neutral)).toBe(false)
    }
    expect(render({ ...preset, face: { ...preset.face, eyeScale: 1.1, eyeAspect: 1 } }).equals(neutral)).toBe(false)
  })
})
