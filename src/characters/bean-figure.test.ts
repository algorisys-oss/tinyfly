import { describe, expect, it } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { character, characterJoints, drawCharacter, drawCharacterHead, type CharacterOptions } from './character'
import { BEAN_CAST, castMember, CHARACTER_CAST } from './cast'
import { HUMAN_EXPRESSIONS, HUMAN_POSES, humanPose } from './species/human'
import { beanLimbLine, beanTorso, beanTorsoOutline, resolveBean } from './body/bean-figure'
import { capabilities } from './capabilities'
import type { Point } from '../adapters/canvas/sketch'
import type { Pose } from './rig/body-plan'

const H = 400
const W = 360
const FEET = 450
const BACKDROP = [255, 0, 0]

/** A bean drawn on a red backdrop, with its feet at (W/2, FEET); returns the pixels and the scene joints. */
function render(options: CharacterOptions, pose: Pose = {}) {
  const who = character({ height: H, figure: 'bean', ...options })
  const full = humanPose(pose)
  const canvas = createCanvas(W, 480)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.fillStyle = `rgb(${BACKDROP.join(',')})`
  ctx.fillRect(0, 0, W, 480)
  ctx.translate(W / 2, FEET)
  drawCharacter(ctx, who, full)
  const data = canvas.getContext('2d').getImageData(0, 0, W, 480).data
  const at = (p: Point) => {
    const x = Math.round(p.x + W / 2)
    const y = Math.round(p.y + FEET)
    const i = (y * W + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
  }
  return { who, joints: characterJoints(who, full), at, png: () => canvas.toBuffer('image/png') }
}

const isInk = ([r, g, b]: number[]) => r < 90 && g < 90 && b < 90
const isWhite = ([r, g, b]: number[]) => r > 235 && g > 235 && b > 235
const isBackdrop = ([r, g, b]: number[]) => r > 200 && g < 60 && b < 60

/** Pixels across a line at `p`, square to `dir`, from -reach to +reach px. */
function across(at: (p: Point) => number[], p: Point, dir: Point, reach: number): number[][] {
  const len = Math.hypot(dir.x, dir.y) || 1
  const nx = -dir.y / len
  const ny = dir.x / len
  return Array.from({ length: 2 * reach + 1 }, (_, i) => at({ x: p.x + nx * (i - reach), y: p.y + ny * (i - reach) }))
}

/** The pattern of a cross-section: backdrop, ink, fill, ink, backdrop (runs collapsed). */
function pattern(pixels: number[][]): string {
  const kinds = pixels.map((c) => (isBackdrop(c) ? 'b' : isInk(c) ? 'i' : isWhite(c) ? 'w' : '?')).filter((k) => k !== '?')
  return kinds.filter((k, i) => i === 0 || k !== kinds[i - 1]).join('')
}

describe('bean figure', () => {
  it('resolves the bean look with every default spelled out', () => {
    const who = character({ height: H, figure: 'bean' })
    expect(who.figure).toBe('bean')
    expect(who.look).toBe('clean')
    expect(who.hands).toBe('mitten')
    expect(who.ink).toBe('#111111')
    expect(who.skin).toBe('#ffffff')
    expect(who.lineWidth).toBeCloseTo(H * 0.0105)
    expect(who.face).toMatchObject({ style: 'oval', projection: 'volume', teeth: true, tongue: true })
    expect(who.bean).toEqual({ limbs: 'tube', torso: 1, limbWidth: 0.024, lineWidth: 0.017, outlineWidth: 0.0105, fill: '#ffffff', shirt: null, sleeves: 'short', trousers: null, shoes: '#ffffff', halo: null, coat: null, fedora: null })
    // The bean is always clean, and wears an outfit's colours itself, not its layers.
    const dressed = character({ figure: 'bean', look: 'pencil', outfit: { shirt: '#ef4444', trousers: '#1e3a5f', sleeves: 'long' } })
    expect(dressed.look).toBe('clean')
    expect(dressed.bean).toMatchObject({ shirt: '#ef4444', trousers: '#1e3a5f', sleeves: 'long' })
    expect(dressed.layers.parts ?? {}).toEqual({})
    expect(character({ figure: 'bean', lineWidth: 8, height: 400 }).lineWidth).toBeCloseTo(8)
    expect(() => character({ figure: 'bean', bean: { limbs: 'wavy' as 'line' } })).toThrow(/limbs/)
    expect(() => character({ figure: 'blob' as 'bean' })).toThrow(/figure/)
    expect(resolveBean({ torso: Number.NaN, limbWidth: 9 })).toMatchObject({ torso: 1, limbWidth: 0.12 })
  })

  it('solves the same joints as any human figure, so every pose works', () => {
    const plain = character({ height: H, figure: 'fluid', headSize: 0.3, shoulderWidth: 0.04, hipWidth: 0.02 })
    for (const pose of [HUMAN_POSES.rest, HUMAN_POSES.wave, { ...HUMAN_POSES.sit, turn: 0.6 }, { ...HUMAN_POSES.cheer, turn: 1 }]) {
      expect(characterJoints(character({ height: H, figure: 'bean' }), pose).points).toEqual(characterJoints(plain, pose).points)
    }
  })

  it('orders parts like the style: back arm, legs, neck, body, front arm, head', () => {
    const order = (options: CharacterOptions, pose: Pose) => {
      const parts = characterJoints(character({ height: H, figure: 'bean', ...options }), humanPose(pose)).parts
      return Object.keys(parts).sort((a, b) => parts[a].order - parts[b].order)
    }
    // Plain tubes join the body without a seam, so the neck and legs draw over it; level, the character's left arm is in front.
    expect(order({}, {})).toEqual(['arm.right', 'spine', 'neck', 'leg.right', 'leg.left', 'arm.left', 'head'])
    // Under a tee and trousers the hems show: the neck and legs go under the body.
    expect(order({ bean: { shirt: '#f00', trousers: '#00f' } }, {})).toEqual(['arm.right', 'leg.right', 'leg.left', 'neck', 'spine', 'arm.left', 'head'])
    // Bare lines: the legs and neck come out from behind the body, the near arm still in front.
    expect(order({ bean: { limbs: 'line' } }, {})).toEqual(['arm.right', 'leg.right', 'leg.left', 'neck', 'spine', 'arm.left', 'head'])
    // Under a coat the legs and neck go under the body too.
    expect(order({ bean: { coat: '#a07a4a' } }, {})).toEqual(['arm.right', 'leg.right', 'leg.left', 'neck', 'spine', 'arm.left', 'head'])
    // Facing screen-right, the right arm is the near one.
    expect(order({}, { turn: 1 }).indexOf('arm.right')).toBeGreaterThan(order({}, { turn: 1 }).indexOf('spine'))
    expect(order({}, { turn: 1 }).indexOf('arm.left')).toBeLessThan(order({}, { turn: 1 }).indexOf('spine'))
    // Seated facing the viewer, the thighs and the hands on the knees come over the lap, even with bare lines.
    const seated = order({ bean: { limbs: 'line' } }, HUMAN_POSES.sit)
    for (const id of ['leg.left', 'leg.right', 'arm.left', 'arm.right']) expect(seated.indexOf(id)).toBeGreaterThan(seated.indexOf('spine'))
  })

  it('draws the shaped body round the hip-to-shoulder line, fuller at the hips than the waist', () => {
    const who = character({ height: H, figure: 'bean' })
    const joints = characterJoints(who, HUMAN_POSES.rest)
    const torso = beanTorso(who.bean!, joints)
    expect(torso.width).toBeCloseTo(H * 0.068)
    const outline = beanTorsoOutline(torso)
    const xs = outline.map((p) => p.x)
    const ys = outline.map((p) => p.y)
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2 * torso.width * 1.0, 0)
    const widthAt = (y: number) => {
      const row = outline.filter((p) => Math.abs(p.y - y) < 3)
      return Math.max(...row.map((p) => p.x)) - Math.min(...row.map((p) => p.x))
    }
    const top = Math.min(...ys)
    const bottom = Math.max(...ys)
    expect(widthAt(top + (bottom - top) * 0.75)).toBeGreaterThan(widthAt(top + (bottom - top) * 0.45))
    expect(beanTorso(resolveBean({ torso: 1.3 }), joints).width).toBeCloseTo(H * 0.068 * 1.3)
  })

  it('has no seam inside a limb: elbows, knees, the shoulder, the neck and the hips are all fill', () => {
    for (const pose of [HUMAN_POSES.rest, HUMAN_POSES.wave, { ...HUMAN_POSES.rest, turn: 0.5 }, { ...HUMAN_POSES.point, turn: 1 }]) {
      const { joints, at } = render({}, pose)
      const P = joints.points
      // Along the front arm (the character's left in these views) from its shoulder through its elbow.
      const front = joints.parts['arm.left'].order > joints.parts.spine.order ? 'left' : 'right'
      const arm = beanLimbLine(P[`shoulder.${front}`], P[`elbow.${front}`], P[`hand.${front}`], 40)
      for (const p of arm.slice(2, 34)) expect(isWhite(at(p)), `arm at ${p.x.toFixed(0)},${p.y.toFixed(0)}`).toBe(true)
      // Where the front arm joins the body: no round end drawn round its root, inside the body.
      const torso = beanTorso(resolveBean(), joints)
      const u = { x: Math.cos(torso.angle), y: Math.sin(torso.angle) }
      const cap = H * (0.024 / 2 + 0.0105)
      const root = { x: P[`shoulder.${front}`].x - u.x * cap, y: P[`shoulder.${front}`].y - u.y * cap }
      for (const turn of [-0.5, 0, 0.5]) {
        const a = Math.atan2(-u.y, -u.x) + turn
        const p = { x: root.x + Math.cos(a) * (cap - H * 0.005), y: root.y + Math.sin(a) * (cap - H * 0.005) }
        expect(isWhite(at(p)), `shoulder join at ${p.x.toFixed(0)},${p.y.toFixed(0)}`).toBe(true)
      }
      // Down each leg from the hip, through the knee, to above the shoe.
      for (const side of ['left', 'right']) {
        const leg = beanLimbLine(P[`hip.${side}`], P[`knee.${side}`], P[`ankle.${side}`], 40)
        for (const p of leg.slice(0, 32)) expect(isWhite(at(p)), `leg.${side} at ${p.x.toFixed(0)},${p.y.toFixed(0)}`).toBe(true)
      }
      // Up the neck from the middle of the shoulders into the head.
      const top = { x: (P['shoulder.left'].x + P['shoulder.right'].x) / 2, y: (P['shoulder.left'].y + P['shoulder.right'].y) / 2 }
      const head = joints.head.center
      // From above the shoulder line (clear of a front arm in profile), past the top of the body, to just under the head.
      const reach = 1 - (joints.head.ry + 4) / Math.hypot(head.x - top.x, head.y - top.y)
      for (let k = 0.25; k <= reach; k += 0.05) {
        const p = { x: top.x + (head.x - top.x) * k, y: top.y + (head.y - top.y) * k }
        expect(isWhite(at(p)), `neck at ${k.toFixed(2)} turn ${pose.turn}`).toBe(true)
      }
    }
  })

  it('has no gap in the outline: every limb is closed by ink on both sides, out to the mittens and shoes', () => {
    for (const pose of [HUMAN_POSES.rest, HUMAN_POSES.wave, { ...HUMAN_POSES.rest, turn: 1 }]) {
      const { joints, at } = render({}, pose)
      const P = joints.points
      for (const side of ['left', 'right']) {
        const arm = beanLimbLine(P[`shoulder.${side}`], P[`elbow.${side}`], P[`hand.${side}`], 40)
        // Outside the body: from below the shoulder to before the mitten.
        for (const i of [16, 20, 24, 28]) {
          const dir = { x: arm[i + 1].x - arm[i - 1].x, y: arm[i + 1].y - arm[i - 1].y }
          const cut = pattern(across(at, arm[i], dir, 14))
          if (cut.startsWith('b') && cut.endsWith('b')) expect(cut, `arm.${side} section ${i}`).toMatch(/^b(i|iwi)+b$/)
        }
        const leg = beanLimbLine(P[`hip.${side}`], P[`knee.${side}`], P[`ankle.${side}`], 40)
        for (const i of [16, 22, 28]) {
          const dir = { x: leg[i + 1].x - leg[i - 1].x, y: leg[i + 1].y - leg[i - 1].y }
          const cut = pattern(across(at, leg[i], dir, 14))
          if (cut.startsWith('b') && cut.endsWith('b')) expect(cut, `leg.${side} section ${i}`).toMatch(/^b(iwi)+b$|^biwiwib$|^biwib$/)
        }
      }
    }
  })

  it('bare line limbs are one ink stroke, with the body, mittens and shoes still white', () => {
    const { joints, at } = render({ bean: { limbs: 'line' } }, HUMAN_POSES.wave)
    const P = joints.points
    const leg = beanLimbLine(P['hip.left'], P['knee.left'], P['ankle.left'], 40)
    for (const p of leg.slice(14, 30)) expect(isInk(at(p))).toBe(true)
    const arm = beanLimbLine(P['shoulder.right'], P['elbow.right'], P['hand.right'], 40)
    for (const p of arm.slice(12, 34)) expect(isInk(at(p))).toBe(true)
    const torso = beanTorso(resolveBean(), joints)
    expect(isWhite(at({ x: torso.cx, y: torso.cy }))).toBe(true)
    // The mitten: white, past the wrist along the forearm.
    const hand = P['hand.right']
    const elbow = P['elbow.right']
    const k = (H * 0.012) / Math.hypot(hand.x - elbow.x, hand.y - elbow.y)
    expect(isWhite(at({ x: hand.x + (hand.x - elbow.x) * k, y: hand.y + (hand.y - elbow.y) * k }))).toBe(true)
  })

  it('stands its shoes on the ground: a flat sole along the ground line and a white upper', () => {
    const { joints, at } = render({}, HUMAN_POSES.rest)
    const ankle = joints.points['ankle.left']
    // Along the ground under the ankle: the sole (ink and its grey strip); above it the white shoe; below, nothing.
    const sole = at({ x: ankle.x + 6, y: -H * 0.004 })
    expect(isWhite(sole) || isBackdrop(sole)).toBe(false)
    expect(isWhite(at({ x: ankle.x + 6, y: -H * 0.035 }))).toBe(true)
    expect(isBackdrop(at({ x: ankle.x, y: H * 0.02 }))).toBe(true)
  })

  it('draws a tee with sleeves, long sleeves and trousers in their colours', () => {
    const shirt = '#3b82f6'
    const { joints, at } = render({ bean: { shirt, trousers: '#334155', sleeves: 'long' } }, HUMAN_POSES.handsOnHips)
    const torso = beanTorso(resolveBean(), joints)
    expect(at({ x: torso.cx, y: torso.cy })).toEqual([0x3b, 0x82, 0xf6])
    const P = joints.points
    const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
    expect(at(mid(P['elbow.right'], P['hand.right']))).toEqual([0x3b, 0x82, 0xf6])
    expect(at(mid(P['knee.left'], P['ankle.left']))).toEqual([0x33, 0x41, 0x55])
  })

  it('wears detective gear: a trench coat to the knee, a fedora, and shades that keep the brows', () => {
    const coat = '#b08a5a'
    const plain = render({}, HUMAN_POSES.rest)
    const dressed = render({ bean: { coat, fedora: '#5b4636', shades: true, shoes: '#111111' } }, HUMAN_POSES.rest)
    const { joints, at } = dressed
    const P = joints.points
    // The coat covers the body and runs past the hips down the thighs.
    const torso = beanTorso(resolveBean(), joints)
    expect(at({ x: torso.cx - torso.width * 0.55, y: torso.cy + torso.length * 0.25 })).toEqual([0xb0, 0x8a, 0x5a])
    const thigh = { x: (P['hip.left'].x + P['knee.left'].x) / 2 + 4, y: P['hip.left'].y + (P['knee.left'].y - P['hip.left'].y) * 0.35 }
    expect(at(thigh)).toEqual([0xb0, 0x8a, 0x5a])
    expect(at({ x: P['knee.left'].x, y: P['knee.left'].y + 20 })).not.toEqual([0xb0, 0x8a, 0x5a])
    // Its sleeves reach the forearm.
    const forearm = { x: P['elbow.left'].x + (P['hand.left'].x - P['elbow.left'].x) * 0.4, y: P['elbow.left'].y + (P['hand.left'].y - P['elbow.left'].y) * 0.4 }
    expect(at(forearm)).toEqual([0xb0, 0x8a, 0x5a])
    // The fedora sits on top of the head, above where the plain head ends.
    const top = { x: joints.head.center.x, y: joints.head.center.y - joints.head.ry * 1.1 }
    expect(isBackdrop(plain.at(top))).toBe(true)
    expect(isBackdrop(at(top))).toBe(false)
    expect(character({ figure: 'bean', bean: { shades: true } }).face.shades).toBe(true)
    // Shades replace the eyes; an angry brow still changes the face.
    const head = (pose: Pose) => {
      const canvas = createCanvas(240, 240)
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
      drawCharacterHead(ctx, character({ height: H, figure: 'bean', bean: { shades: true } }), humanPose(pose), { x: 120, y: 120, radius: 90 })
      return canvas
    }
    const calm = head({})
    expect(calm.toBuffer('image/png').equals(head({ browTilt: -1, 'brow.left': -0.5 }).toBuffer('image/png'))).toBe(false)
    expect(calm.toBuffer('image/png').equals(head({ lookX: 1 }).toBuffer('image/png'))).toBe(true)
    const lens = calm.getContext('2d').getImageData(120 + 26, 120 - 6, 1, 1).data
    expect(lens[0] + lens[1] + lens[2]).toBeLessThan(300)
  })

  it('gives line limbs an optional pale halo, and dark shoes a dark sole', () => {
    const { joints, at } = render({ bean: { limbs: 'line', halo: '#00ff00' } }, HUMAN_POSES.rest)
    const P = joints.points
    const leg = beanLimbLine(P['hip.left'], P['knee.left'], P['ankle.left'], 40)
    const p = leg[24]
    const dir = { x: leg[25].x - leg[23].x, y: leg[25].y - leg[23].y }
    expect(across(at, p, dir, 12).some(([r, g, b]) => g > 200 && r < 60 && b < 60)).toBe(true)
    const dark = render({ bean: { shoes: '#111111' } }, HUMAN_POSES.rest)
    const sole = dark.at({ x: dark.joints.points['ankle.left'].x + 6, y: -H * 0.004 })
    expect(isWhite(sole)).toBe(false)
  })

  it('oval eyes follow the expression fields and the gaze, and fit glasses round them', () => {
    const head = (options: CharacterOptions, pose: Pose) => {
      const canvas = createCanvas(240, 240)
      const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
      drawCharacterHead(ctx, character({ height: H, figure: 'bean', ...options }), humanPose(pose), { x: 120, y: 120, radius: 90 })
      return canvas.toBuffer('image/png')
    }
    const neutral = head({}, {})
    const changes: Pose[] = [{ lookX: 1 }, { lookY: 1 }, { blink: 1 }, { lid: 0.6 }, { 'brow.left': 1 }, { browTilt: -1 }, { 'eye.left': 0.4 }, { pupil: 1.5 }]
    for (const fields of changes) {
      expect(head({}, fields).equals(neutral), JSON.stringify(fields)).toBe(false)
    }
    for (const name of Object.keys(HUMAN_EXPRESSIONS) as Array<keyof typeof HUMAN_EXPRESSIONS>) expect(() => head({}, HUMAN_EXPRESSIONS[name])).not.toThrow()
    expect(head({ glasses: 'round' }, {}).equals(neutral)).toBe(false)
    // The oval style works on any figure, through face.style.
    const fluid = character({ height: H, face: { style: 'oval' } })
    expect(fluid.face.style).toBe('oval')
  })

  it('draws mittens on other figures too', () => {
    const canvas = (hands: 'dot' | 'mitten') => {
      const c = createCanvas(200, 340)
      const ctx = c.getContext('2d') as unknown as CanvasRenderingContext2D
      ctx.translate(100, 320)
      drawCharacter(ctx, character({ height: 300, hands }), HUMAN_POSES.wave)
      return c.toBuffer('image/png')
    }
    expect(canvas('mitten').equals(canvas('dot'))).toBe(false)
  })

  it('ships original bean presets through castMember and lists them in the catalog', () => {
    expect(Object.keys(BEAN_CAST)).toEqual(['beanMan', 'beanWoman', 'beanKid', 'beanBoss', 'beanDetective', 'beanStick'])
    for (const name of Object.keys(BEAN_CAST) as Array<keyof typeof BEAN_CAST>) {
      expect(CHARACTER_CAST[name]).toBe(BEAN_CAST[name])
      const who = character(castMember(name, 400))
      expect(who.figure).toBe('bean')
      expect(who.height).toBe(Math.round(400 * BEAN_CAST[name].scale))
    }
    expect(character(castMember('beanStick', 400)).bean?.limbs).toBe('line')
    const catalog = capabilities()
    expect(catalog.character.figureStyles).toContain('bean')
    expect(catalog.character.faceStyles).toContain('oval')
    expect(catalog.character.cast).toEqual(expect.arrayContaining(Object.keys(BEAN_CAST)))
  })
})
