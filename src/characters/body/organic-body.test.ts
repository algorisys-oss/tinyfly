import { describe, expect, it, vi } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { character, characterJoints, drawCharacter, drawCharacterHead, jointsInScene, characterJointsInView, type Character } from '../character'
import { humanPose, HUMAN_POSES, HUMAN_REST, mirrorHumanPose } from '../species/human'
import { humanGaitPose } from '../species/human-motion'
import { softCartoonCharacter, SOFT_CARTOON_CAST } from '../soft-cartoon-cast'
import { leafOutfit, leafOutfitContours, type LeafOutfitOptions } from '../wardrobe/leaf-outfit'
import { insideBodyContour, organicCenterLine, organicContourSection } from './organic-geometry'
import { faceToScreen } from '../head/face'
import { headOutline } from '../head/head-shape'
import * as headShapes from '../head/head-shape'
import { bodyProfileWidth } from './organic-body'
import type { Point } from '../../adapters/canvas/sketch'
import { drawOrganicPart } from './organic-draw'
import { createPen } from '../look/pen'
import { shadeSkinOutline } from '../look/skin-shading'
import { loadScene3D, drawScene3D, resolveScene3D, type Scene3D } from '../../scene-3d'
import { characterObjects } from '../scene-objects'
import { mat4 } from '../../engine/math'
import type { CharacterOptions } from '../character'

function render(who: Character, pose = humanPose()) {
  const canvas = createCanvas(500, 450), ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 500, 450); ctx.translate(250, 425)
  drawCharacter(ctx as unknown as CanvasRenderingContext2D, who, pose, 0)
  return ctx.getImageData(0, 0, 500, 450).data
}
function colorNear(data: Uint8ClampedArray, p: Point, color: string, radius = 5): number {
  const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16))
  let n = 0
  for (let y = Math.floor(425 + p.y - radius); y <= Math.ceil(425 + p.y + radius); y++) for (let x = Math.floor(250 + p.x - radius); x <= Math.ceil(250 + p.x + radius); x++) {
    const offset = (y * 500 + x) * 4
    if (rgb.every((channel, i) => Math.abs(data[offset + i] - channel) < 12)) n++
  }
  return n
}

describe('organic character anatomy and material', () => {
  it.each(['clean', 'pencil', 'silhouette'] as const)('preserves non-organic transparent-skin hand semantics in %s', look => {
    for (const figure of ['fluid', 'stick'] as const) for (const hands of ['dot', 'cartoon'] as const) {
      const pose = humanPose({ ...HUMAN_POSES.point, turn: 0 })
      const who = character({ figure, hands, look, height: 300, skin: 'none' })
      const wrist = characterJoints(who, pose).points['hand.right']
      const transparent = render(who, pose)
      const white = render(character({ figure, hands, look, height: 300, skin: '#ffffff' }), pose)
      for (let y = Math.round(425 + wrist.y) - 15; y <= Math.round(425 + wrist.y) + 15; y++) {
        const start = (y * 500 + Math.round(250 + wrist.x) - 15) * 4
        expect(transparent.slice(start, start + 31 * 4)).toEqual(white.slice(start, start + 31 * 4))
      }
    }
  })

  it.each(['clean', 'pencil', 'silhouette'] as const)('keeps transparent dot and articulated skin outline-only in %s 2D and 3D draws', look => {
    for (const hands of ['dot', 'cartoon'] as const) for (const override of [false, true]) for (const alpha of [0, .35, 1]) for (const inScene of [false, true]) {
      const options: CharacterOptions = { figure: 'organic', height: 300, look, hands, ears: true, skin: override ? '#00ff00' : 'none', body: { ...(override ? { fill: 'none' } : {}), outline: { width: 1 }, shading: { opacity: .8, highlight: .5 } } }
      const pose = humanPose({ ...HUMAN_POSES.point, turn: 0, 'head.turn': 0 })
      const size = { width: 500, height: 450 }
      const ctx = createCanvas(size.width, size.height).getContext('2d') as unknown as CanvasRenderingContext2D
      const renderSkin = (fill: string, shaded: boolean) => {
        ctx.resetTransform(); ctx.clearRect(0, 0, size.width, size.height)
        const who = character({ ...options, body: { ...options.body, fill, shading: shaded ? options.body?.shading : { mode: 'none' } } })
        if (inScene) {
          const json: Scene3D = { id: 'stage', camera: 'cam', objects: [
            { id: 'cam', kind: 'camera', projection: 'orthographic', height: 2.5, near: .1, far: 50, position: [0, 1, 5] },
            { id: 'actor', kind: 'character', height: 1.7, character: { ...options, body: { ...options.body, fill, outline: { width: 1 / 300 }, shading: shaded ? options.body?.shading : { mode: 'none' } } }, pose, shadow: false },
            { id: 'sky', kind: 'light', light: 'ambient', color: '#ffffff', intensity: .4 },
          ] }
          const loaded = loadScene3D(json, { kinds: [characterObjects] })
          const frame = resolveScene3D(loaded, new Map(), size)
          const projection = { toView: (v: [number, number, number]) => mat4.transformPoint(frame.camera.view, v), toScreen: (v: [number, number, number]) => {
            const ndc = mat4.transformPoint(frame.camera.projection, v)
            return { x: (ndc[0] + 1) * size.width / 2, y: (1 - ndc[1]) * size.height / 2 }
          } }
          ctx.globalAlpha = alpha
          drawScene3D(ctx, loaded, undefined, size)
          ctx.globalAlpha = 1
          return { pixels: ctx.getImageData(0, 0, size.width, size.height).data, joints: characterJointsInView(who, pose, projection, { height: 1.7 }) }
        }
        ctx.globalAlpha = alpha; ctx.translate(250, 425)
        drawCharacter(ctx, who, pose)
        const joints = jointsInScene(characterJoints(who, pose), 250, 425)
        ctx.globalAlpha = 1
        return { pixels: ctx.getImageData(0, 0, size.width, size.height).data, joints }
      }
      const transparent = renderSkin('none', true)
      expect(character(options).skin).toBe('none')
      expect(Buffer.from(transparent.pixels).equals(Buffer.from(renderSkin('none', false).pixels))).toBe(true)
      if (alpha === 0) {
        expect(transparent.pixels.every(value => value === 0)).toBe(true)
        continue
      }
      const opaque = renderSkin('#00ff00', true).pixels
      const wrist = transparent.joints.points['hand.right']
      const radius = hands === 'dot' ? 2 : 14
      let exposed = 0, outline = 0
      for (let y = Math.round(wrist.y) - radius; y <= Math.round(wrist.y) + radius; y++) for (let x = Math.round(wrist.x) - radius; x <= Math.round(wrist.x) + radius; x++) {
        const offset = (y * size.width + x) * 4
        if (opaque[offset + 3] > 0 && transparent.pixels[offset + 3] === 0) exposed++
        if (transparent.pixels[offset + 3] > 0) outline++
      }
      expect(exposed, `${hands} ${override} ${alpha} ${inScene}`).toBeGreaterThan(hands === 'dot' ? 3 : 12)
      if (hands === 'cartoon') expect(outline).toBeGreaterThan(10)
      for (const point of [transparent.joints.bodyContours!.spine.samples[10].center,
        { x: transparent.joints.head.center.x - transparent.joints.head.rx * .5, y: transparent.joints.head.center.y },
        { x: transparent.joints.head.center.x + transparent.joints.head.rx * 1.12, y: transparent.joints.head.center.y + transparent.joints.head.ry * .02 },
      ]) {
        const offset = (Math.round(point.y) * size.width + Math.round(point.x)) * 4
        expect(transparent.pixels[offset + 3]).toBe(0)
        expect(opaque[offset + 3]).toBeGreaterThan(0)
      }
    }
  })

  it.each(['clean', 'pencil', 'silhouette'] as const)('reuses a head outline within each %s draw without caching across poses', look => {
    const outline = vi.spyOn(headShapes, 'headOutline')
    try {
      for (const shape of ['round', 'angular'] as const) for (const projection of ['volume', 'cartoon'] as const) {
        const who = character({ figure: 'organic', look, face: { shape, projection } })
        let previous: Point[] | undefined
        for (const turn of [0, .7, 1, 2]) {
          outline.mockClear()
          render(who, humanPose({ turn }))
          const calls = projection === 'volume' || shape === 'angular' || look !== 'silhouette' ? 1 : 0
          expect(outline).toHaveBeenCalledTimes(calls)
          if (calls) {
            const current = outline.mock.results[0].value as Point[]
            expect(current.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
            if (previous) expect(current).not.toBe(previous)
            previous = current
          }
        }
      }
    } finally {
      outline.mockRestore()
    }
  })

  it.each([0, .25, 1])('multiplies body, face and palm shading by inherited alpha %s', alpha => {
    const who = character({ figure: 'organic', body: { outline: { width: 0 }, shading: { opacity: .4, highlight: .2 } } })
    const j = characterJoints(who, humanPose())
    const ctx = createCanvas(500, 450).getContext('2d') as unknown as CanvasRenderingContext2D
    const fills: number[] = [], strokes: number[] = []
    const fill = vi.spyOn(ctx, 'fill').mockImplementation(() => { fills.push(ctx.globalAlpha) })
    const stroke = vi.spyOn(ctx, 'stroke').mockImplementation(() => { strokes.push(ctx.globalAlpha) })
    ctx.globalAlpha = alpha
    const pen = createPen(ctx, { look: 'clean', ink: who.ink, lineWidth: 0, seed: 1, time: 0 })
    drawOrganicPart(ctx, pen, who.body!, j, 'spine')
    expect(fills).toHaveLength(3)
    fills.forEach((value, i) => expect(value).toBeCloseTo(i ? alpha * .4 : alpha, 2))
    expect(strokes).toHaveLength(1)
    expect(strokes[0]).toBeCloseTo(alpha * .2, 2)
    expect(ctx.globalAlpha).toBeCloseTo(alpha)
    fills.length = 0
    shadeSkinOutline(ctx, headOutline(j.head, who.face), j.head.center, who.body!.shading)
    expect(fills).toHaveLength(1)
    expect(fills[0]).toBeCloseTo(alpha * .4, 2)
    expect(ctx.globalAlpha).toBeCloseTo(alpha)
    fill.mockRestore(); stroke.mockRestore()
  })

  it('leaves a transparent canvas untouched when drawing an organic character at zero alpha', () => {
    const ctx = createCanvas(500, 450).getContext('2d') as unknown as CanvasRenderingContext2D
    ctx.translate(250, 425); ctx.globalAlpha = 0
    drawCharacter(ctx, character({ figure: 'organic' }), humanPose())
    expect(ctx.getImageData(0, 0, 500, 450).data.every(value => value === 0)).toBe(true)
    expect(ctx.globalAlpha).toBe(0)
  })

  it('keeps dimensions independent of ink, including a zero-width contour', () => {
    const poses = [humanPose(), HUMAN_POSES.cheer, HUMAN_POSES.think, HUMAN_POSES.sit, humanGaitPose('walk', .2), humanPose({ turn: 1 })]
    for (const pose of poses) {
      const geometry = [0, 1, 5].map(width => characterJoints(character({ figure: 'organic', height: 300, body: { outline: { width } } }), pose))
      expect(geometry[0].bodyContours).toEqual(geometry[1].bodyContours)
      expect(geometry[2].bodyContours).toEqual(geometry[1].bodyContours)
      expect(geometry[0].points).toEqual(geometry[2].points)
    }
  })

  it('uses owned JSON profiles, bounded interpolation and one skin for body, face and palms', () => {
    const options = JSON.parse(JSON.stringify(SOFT_CARTOON_CAST.youngWoman))
    const who = character({ ...options, height: 300, outfit: null, skin: '#ba7851', body: { ...options.body, shading: { mode: 'none' } } })
    options.body.torso[0].width = .2
    expect(who.body!.torso[0].width).toBe(.098)
    expect(who.skin).toBe(who.body!.fill)
    const profile = [{ at: 0, width: .03 }, { at: .5, width: .017 }, { at: 1, width: .01 }]
    for (let i = -10; i <= 110; i++) expect(bodyProfileWidth(profile, i / 100)).toBeGreaterThanOrEqual(.01)
    const pose = humanPose({ ...HUMAN_POSES.point, turn: 0 })
    const j = characterJoints(who, pose), pixels = render(who, pose)
    for (const p of [j.head.center, j.chains.spine[1], j.points['elbow.left'], j.points['knee.left'], j.points['hand.right']]) expect(colorNear(pixels, p, who.skin)).toBeGreaterThan(15)
    const filled = character({ figure: 'organic', skin: '#ffffff', body: { fill: '#a86443' } })
    expect(filled.skin).toBe('#a86443')
  })

  it('rejects invalid profile/material data at construction', () => {
    for (const body of [
      { torso: [{ at: .1, width: .1 }, { at: 1, width: .1 }] },
      { arm: [{ at: 0, width: .1 }, { at: .5, width: .02 }, { at: .4, width: .02 }, { at: 1, width: .01 }] },
      { leg: [{ at: 0, width: NaN }, { at: 1, width: .01 }] },
      { depth: 0 }, { shading: { light: [0, 0] as [number, number] } }, { shading: { opacity: 2 } }, { outline: { width: -1 } },
    ]) expect(() => character({ figure: 'organic', body })).toThrow(/organic body/)
    expect(() => organicCenterLine([{ x: 0, y: 0 }, { x: 1, y: 1 }], 0)).toThrow(/steps/)
    expect(() => character({ leafOutfit: {} })).toThrow(/requires figure/)
  })

  it('shares the native joint/contact solution and translates contours into scene space', () => {
    const who = character({ figure: 'organic' })
    const legacy = character({ figure: 'fluid', plan: who.plan, height: who.height, lineWidth: who.lineWidth })
    for (const pose of [HUMAN_POSES.sit, HUMAN_POSES.cheer, humanGaitPose('walk', .33)]) {
      const a = characterJoints(who, pose), b = characterJoints(legacy, pose)
      expect(a.points).toEqual(b.points); expect(a.grounded).toEqual(b.grounded); expect(a.groundY).toBe(b.groundY)
      expect(Object.values(a.parts).map(part => part.depth)).toEqual(Object.values(b.parts).map(part => part.depth))
      const moved = jointsInScene(a, 40, 80)
      expect(moved.bodyContours!.spine.outline[0]).toEqual({ x: a.bodyContours!.spine.outline[0].x + 40, y: a.bodyContours!.spine.outline[0].y + 80 })
      expect(moved.bodyContours!.spine.samples[0].center.y).toBe(a.bodyContours!.spine.samples[0].center.y + 80)
    }
  })

  it('keeps continuous elbows/knees and connected shoulders without interior joint rings', () => {
    const who = character({ figure: 'organic', height: 300, skin: '#efbd96', body: { shading: { mode: 'none' } } })
    const pose = humanPose({ ...HUMAN_POSES.think, turn: 0 })
    const j = characterJoints(who, pose), pixels = render(who, pose)
    for (const name of ['shoulder.left', 'shoulder.right', 'elbow.left', 'knee.left']) expect(colorNear(pixels, j.points[name], who.skin, 3), name).toBeGreaterThan(28)
    const line = organicCenterLine(j.chains['arm.right'].slice(0, 3))
    expect(line[12]).toEqual(j.points['elbow.right'])
    const before = line[11], after = line[13], elbow = line[12]
    const dot = ((elbow.x - before.x) * (after.x - elbow.x) + (elbow.y - before.y) * (after.y - elbow.y)) / (Math.hypot(elbow.x - before.x, elbow.y - before.y) * Math.hypot(after.x - elbow.x, after.y - elbow.y))
    expect(dot).toBeGreaterThan(.9)
  })

  it('produces deterministic filled contours through turns, bent limbs and native perspective', () => {
    for (const turn of [0, .5, 1, 2, -1, -.5]) for (const name of ['rest', 'cheer', 'point', 'think', 'sit'] as const) {
      const who = softCartoonCharacter('youngWoman', { height: 300 })
      const pose = humanPose({ ...HUMAN_POSES[name], turn })
      const j = characterJoints(who, pose)
      expect(Object.values(j.bodyContours!).flatMap(shape => shape.outline).every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
      expect(Buffer.from(render(who, pose)).equals(Buffer.from(render(who, pose)))).toBe(true)
    }
    const j = characterJointsInView(character({ figure: 'organic' }), humanPose({ turn: .5 }), { toView: p => p, toScreen: ([x, y]) => ({ x: x * 100 + 250, y: 350 - y * 100 }) }, { height: 3 })
    expect(j.bodyContours!.spine.outline.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
  })

  it('clips deterministic shading inside filled shapes and leaves legacy modes opt-in', () => {
    const flat = character({ figure: 'organic', height: 300, body: { shading: { mode: 'none' } } })
    const shaded = character({ figure: 'organic', height: 300 })
    const a = render(flat), b = render(shaded)
    let differences = 0
    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1]) {
      differences++
      expect(a[i] === 255 && a[i + 1] === 255 && a[i + 2] === 255).toBe(false)
    }
    expect(differences).toBeGreaterThan(1000)
    for (const figure of ['fluid', 'stick'] as const) {
      const who = character({ figure })
      expect(who.body).toBeUndefined(); expect(characterJoints(who, humanPose()).bodyContours).toBeUndefined()
      expect(Buffer.from(render(who)).equals(Buffer.from(render(character({ figure, body: { fill: '#000000', outline: { width: 0 } } }))))).toBe(true)
    }
  })
})

describe('organic wardrobe coverage', () => {
  it('covers rounded sleeve and trouser attachments through raised, bent and seated poses', () => {
    const ctx = createCanvas(1, 1).getContext('2d')
    const contains = (point: Point, outline: Point[]) => {
      ctx.beginPath(); outline.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath()
      return ctx.isPointInPath(point.x, point.y)
    }
    for (const turn of [0, .5, 1, 1.5, 2, -1, -.5]) for (const base of [HUMAN_POSES.rest, HUMAN_POSES.cheer, HUMAN_POSES.think, HUMAN_POSES.sit, humanGaitPose('walk', .2)]) {
      const j = characterJoints(softCartoonCharacter('youngMan', { height: 300 }), humanPose({ ...base, turn }))
      const ids = ['spine', 'arm.left', 'arm.right', 'leg.left', 'leg.right']
      const garments = ids.map(id => organicContourSection(j.bodyContours![id], 0, id.startsWith('arm') ? .45 : id === 'spine' ? .97 : 1, 1.8))
      for (const id of ids) {
        const shape = j.bodyContours![id]
        const root = shape.samples[0].center
        for (const point of shape.outline.slice(shape.samples.length * 2 + 7)) {
          const probe = { x: root.x + (point.x - root.x) * .8, y: root.y + (point.y - root.y) * .8 }
          // Shirt and trousers overlap at the hip; sleeves overlap the shirt.
          // Coverage belongs to the union of the actual garments.
          if (contains(probe, shape.outline)) expect(garments.some(garment => contains(probe, garment)), `${id} at ${turn}`).toBe(true)
        }
      }
    }
  })
})

describe('organic face projection', () => {
  it('turns a flatter facial plane with the head while keeping the rear cranium rounded', () => {
    const who = softCartoonCharacter('youngMan')
    for (const shape of ['round', 'angular'] as const) for (const turn of [-1, 1]) {
      const head = characterJoints(who, humanPose({ turn })).head
      const outline = headOutline(head, { ...who.face, shape, nose: false })
      const faceEdge = outline.filter(p => Math.abs(p.y - head.center.y) < head.ry * .35)
      expect(Math.max(...faceEdge.map(p => (p.x - head.center.x) * turn))).toBeLessThan(head.rx * .84)
      expect(Math.min(...outline.map(p => (p.x - head.center.x) * turn))).toBeLessThan(-head.rx * .98)
    }
    const head = characterJoints(who, humanPose()).head
    const front = headOutline(head, { ...who.face, shape: 'round', nose: false })
    expect(Math.max(...front.map(p => p.x))).toBeCloseTo(head.center.x + head.rx, 5)
    expect(Math.min(...front.map(p => p.x))).toBeCloseTo(head.center.x - head.rx, 5)
  })
  it('keeps the visible eye continuous as a head crosses either profile', () => {
    const who = softCartoonCharacter('youngWoman')
    for (const profile of [1, -1]) {
      const heads = [profile - .0001, profile + .0001].map(turn => characterJoints(who, humanPose({ turn })).head)
      for (const x of [-.34, .34]) for (const projection of ['cartoon', 'volume'] as const) {
        const points = heads.map(head => faceToScreen(head, [{ x, y: .12 }], { x, y: .12 }, projection).points[0])
        expect(Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)).toBeLessThan(.1)
      }
    }
  })
  it('carries the near eye and mouth around the head volume and narrows the far eye before hiding it', () => {
    const who = softCartoonCharacter('youngMan')
    expect(who.face.projection).toBe('volume')
    expect(character().face.projection).toBeUndefined()
    const eye = { x: -.34, y: .12 }, mouth = { x: 0, y: -.4 }
    for (const turn of [.6, .82, 1]) {
      const head = characterJoints(who, humanPose({ turn })).head
      for (const center of [eye, mouth]) {
        const classic = faceToScreen(head, [center], center).points[0]
        const volume = faceToScreen(head, [center], center, 'volume').points[0]
        expect(volume.x).toBeGreaterThan(classic.x + head.rx * .12)
        expect(volume.x - head.center.x).toBeLessThan(head.rx * .95)
      }
    }
    const far = { x: .34, y: .12 }
    const width = (turn: number) => {
      const head = characterJoints(who, humanPose({ turn })).head
      const points = faceToScreen(head, [{ x: far.x - .2, y: far.y }, { x: far.x + .2, y: far.y }], far, 'volume').points
      return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
    }
    expect(width(.97)).toBeLessThan(width(.6) * .15)
  })
  it('retains both eyes in three-quarter views and projects a small nose in either profile', () => {
    const who = softCartoonCharacter('youngMan', { hair: null, face: { iris: '#ff00ff' }, body: { shading: { mode: 'none' } }, height: 300 })
    for (const turn of [.5, .6, .75, -.5, -.6, -.75]) {
      const pose = humanPose({ turn }), head = characterJoints(who, pose).head
      const ctx = createCanvas(260, 260).getContext('2d')
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 260, 260)
      drawCharacterHead(ctx as unknown as CanvasRenderingContext2D, who, pose, { x: 130, y: 130, radius: 90 })
      for (const x of [-.34, .34]) {
        const projected = faceToScreen(head, [{ x, y: .12 }], { x, y: .12 }, 'volume')
        expect(projected.facing).toBeGreaterThan(.05)
        const p = projected.points[0], scale = 90 / head.rx
        const pixels = ctx.getImageData(Math.round(130 + (p.x - head.center.x) * scale) - 7, Math.round(130 + (p.y - head.center.y) * scale) - 7, 15, 15).data
        let iris = 0
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 230 && pixels[i + 1] < 30 && pixels[i + 2] > 230) iris++
        expect(iris, `eye ${x}, turn ${turn}`).toBeGreaterThan(3)
      }
    }
    for (const turn of [-1, 1]) {
      const head = characterJoints(who, humanPose({ turn })).head
      const leading = (nose: boolean) => Math.max(...headOutline(head, { ...who.face, nose }).map(p => (p.x - head.center.x) * turn))
      expect(leading(true) - leading(false)).toBeGreaterThan(head.rx * .06)
      expect(leading(true) - leading(false)).toBeLessThan(head.rx * .16)
      const plain = headOutline(head, { ...who.face, nose: false })
      // Extra samples below the nose must lie on the original jaw edges.
      for (const p of headOutline(head, who.face).filter(p => p.y > head.center.y + head.ry * .4)) {
        const distances = plain.map((a, i) => {
          const b = plain[(i + 1) % plain.length], dx = b.x - a.x, dy = b.y - a.y
          const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)))
          return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
        })
        expect(Math.min(...distances)).toBeLessThan(1e-6)
      }
    }
  })
})

describe('organic arm and garment depth', () => {
  it('keeps foreground wrists visible across the waist during interpolated gestures on either actor', () => {
    for (const name of ['youngMan', 'youngWoman'] as const) for (const leaves of [false, true]) for (const mirrored of [false, true]) {
      const who = softCartoonCharacter(name, { height: 300, body: { shading: { mode: 'none' } }, ...(leaves ? { outfit: null, leafOutfit: { top: true } } : {}) })
      for (const t of [.2, .3, .4, .5, .6]) {
        const blended = humanPose(Object.fromEntries(Object.keys(HUMAN_REST).map(key => [key, HUMAN_REST[key] + ((HUMAN_POSES.think[key] ?? HUMAN_REST[key]) - HUMAN_REST[key]) * t])))
        const pose = mirrored ? mirrorHumanPose({ ...blended, turn: .15 }) : { ...blended, turn: .15 }
        const side = mirrored ? 'left' : 'right', j = characterJoints(who, pose)
        expect(j.parts[`arm.${side}`].order).toBeGreaterThan(Math.max(j.parts.spine.order, j.parts['leg.left'].order, j.parts['leg.right'].order))
        expect(colorNear(render(who, pose), j.points[`hand.${side}`], who.skin, 3), `${name} ${leaves} ${mirrored} ${t}`).toBeGreaterThan(12)
      }
    }
  })
})

describe('organic leaf wardrobe', () => {
  it('owns leaf options for both the character option and the public layer API', () => {
    for (const top of [undefined, false, true]) for (const asLayers of [false, true]) {
      const options: LeafOutfitOptions = { top, length: .25, color: '#456723', accent: '#89ab45' }
      const who = character({ figure: 'organic', ...(asLayers ? { layers: leafOutfit(options) } : { leafOutfit: options }) })
      const before = render(who)
      options.top = !top; options.length = .45; options.color = '#ff0000'; options.accent = '#0000ff'
      expect(Buffer.from(render(who)).equals(Buffer.from(before))).toBe(true)
      options.length = NaN
      expect(Buffer.from(render(who)).equals(Buffer.from(before))).toBe(true)
    }
  })

  it('validates leaf options at construction and in the public contour API', () => {
    const j = characterJoints(character({ figure: 'organic' }), humanPose())
    const invalid: LeafOutfitOptions[] = [
      ...[NaN, Infinity, -Infinity, .19, .46, '0.32'].map(length => ({ length } as LeafOutfitOptions)),
      { top: 'false' } as unknown as LeafOutfitOptions,
      { color: 42 } as unknown as LeafOutfitOptions,
      { accent: {} } as unknown as LeafOutfitOptions,
    ]
    for (const options of invalid) {
      expect(() => leafOutfit(options)).toThrow(/leafOutfit:/)
      expect(() => character({ figure: 'organic', leafOutfit: options })).toThrow(/leafOutfit:/)
      expect(() => leafOutfitContours(j, options)).toThrow(/leafOutfit:/)
    }
    for (const length of [.2, .45]) {
      expect(() => leafOutfit({ length, top: false })).not.toThrow()
      expect(leafOutfitContours(j, { length, top: false }).top).toBeUndefined()
    }
  })

  it('covers hip/thigh roots and chest through standing, seated and walking turns', () => {
    for (const turn of [0, .5, 1, 2, -1, -.5]) for (const base of [HUMAN_POSES.rest, HUMAN_POSES.sit, humanGaitPose('walk', .2)]) {
      const who = softCartoonCharacter('youngWoman', { height: 300, outfit: null, leafOutfit: {}, hair: null })
      // Keep the coverage probes visible: hanging palms can legitimately
      // occlude the upper thighs as the walking rig changes drawing order.
      const pose = humanPose({ ...base, turn, 'arm.left.spread': 130, 'arm.right.spread': 130, 'arm.left.swing': 0, 'arm.right.swing': 0, 'arm.left.elbow': 0, 'arm.right.elbow': 0, 'arm.left.bend': 0, 'arm.right.bend': 0 })
      const j = characterJoints(who, pose), garment = leafOutfitContours(j)
      const pixels = render(who, pose)
      const covered = (p: Point) => {
        let green = 0
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
          const offset = ((Math.round(425 + p.y) + dy) * 500 + Math.round(250 + p.x) + dx) * 4
          if (pixels[offset + 1] > pixels[offset]) green++
        }
        return green > 15 // allow thin ink veins through a filled cloth region
      }
      for (const side of ['left', 'right']) {
        const thigh = j.bodyContours![`leg.${side}`].samples[3].center
        expect(insideBodyContour(thigh, garment.skirt)).toBe(true)
        expect(covered(thigh), `${turn} ${side}`).toBe(true)
      }
      const chest = j.bodyContours!.spine.samples.find(s => s.at >= .7)!.center
      expect(insideBodyContour(chest, garment.top!)).toBe(true)
      expect(covered(chest)).toBe(true)
    }
  })
})
