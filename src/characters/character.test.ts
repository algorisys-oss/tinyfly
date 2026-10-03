import { describe, it, expect, beforeAll } from 'vitest'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import {
  character,
  characterAt,
  characterJoints,
  characterTarget,
  drawCharacter,
  mixPoses,
  reachCharacter,
  characterPoseTracks,
  type CharacterLayers,
} from './character'
import { HUMAN_POSES, HUMAN_REST, humanFieldLabel, humanPose } from './species/human'
import { faceToScreen } from './head/face'
import type { Point } from '../adapters/canvas/sketch'
import { CanvasAdapter } from '../adapters/canvas'
import { deserializeTimeline } from '../engine/serialization'
import type { TimelineDefinition } from '../engine/types'

/** A context that records the points of every stroked path (no transforms are used by the drawing). */
function recordingContext() {
  let path: Point[] = []
  const strokes: Point[][] = []
  const log: string[] = []
  const methods = {
    beginPath: () => (path = []),
    moveTo: (x: number, y: number) => path.push({ x, y }),
    lineTo: (x: number, y: number) => path.push({ x, y }),
    stroke: () => {
      strokes.push(path)
      log.push('stroke')
    },
    fill: () => log.push('fill'),
  }
  const store: Record<string | symbol, unknown> = {}
  const ctx = new Proxy(store, {
    get: (_, key) => (key in methods ? methods[key as keyof typeof methods] : key in store ? store[key] : () => undefined),
    set: (_, key, value) => ((store[key] = value), true),
  }) as unknown as CanvasRenderingContext2D
  return { ctx, strokes, log }
}

const close = (a: Point, b: Point, digits = 1) => {
  expect(a.x).toBeCloseTo(b.x, digits)
  expect(a.y).toBeCloseTo(b.y, digits)
}

const pixels = (draw: (ctx: CanvasRenderingContext2D) => void) => {
  const canvas = createCanvas(300, 340)
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  ctx.translate(150, 330)
  draw(ctx)
  return Array.from(canvas.getContext('2d').getImageData(0, 0, 300, 340).data).join()
}

describe('character joints', () => {
  it('match what the stick figure strokes', () => {
    const who = character({ figure: 'stick', height: 300 })
    for (const pose of [HUMAN_REST, HUMAN_POSES.wave, HUMAN_POSES.kneel, humanPose({ turn: 0.6, lean: 20 })]) {
      const { ctx, strokes } = recordingContext()
      drawCharacter(ctx, who, pose)
      const joints = characterJoints(who, pose)
      for (const id of ['leg.left', 'leg.right', 'arm.left', 'arm.right']) {
        const part = joints.parts[id].points
        const same = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-6
        const drawn = strokes.find((s) => s.length === part.length && same(s[0], part[0]) && same(s[s.length - 1], part[part.length - 1]))
        expect(drawn, id).toBeDefined()
        drawn!.forEach((p, i) => close(p, part[i], 6))
      }
    }
  })

  it('name the hands, feet and other landmarks', () => {
    const joints = characterJoints(character(), HUMAN_REST)
    for (const name of ['hip', 'neck', 'hand.left', 'hand.right', 'knee.left', 'ankle.right', 'toe.left']) expect(joints.points[name], name).toBeDefined()
    // Facing the viewer, the character's left hand is on screen-right.
    expect(joints.points['hand.left'].x).toBeGreaterThan(joints.points['hand.right'].x)
  })
})

describe('turning', () => {
  const who = character({ height: 300 })

  it('shows the back at turn 2: the front view mirrored', () => {
    const front = characterJoints(who, humanPose({ turn: 0 }))
    const back = characterJoints(who, humanPose({ turn: 2 }))
    for (const name of ['hand.left', 'hand.right', 'knee.left', 'toe.right']) {
      close(back.points[name], { x: -front.points[name].x, y: front.points[name].y }, 3)
    }
  })

  it('mirrors the two profiles', () => {
    const right = characterJoints(who, humanPose({ turn: 1 }))
    const left = characterJoints(who, humanPose({ turn: 3 }))
    for (const name of ['hand.left', 'hand.right', 'toe.left', 'neck']) {
      close(left.points[name], { x: -right.points[name].x, y: right.points[name].y }, 3)
    }
  })

  it('shows spread from the front and swing from the side', () => {
    const out = humanPose({ 'arm.left.spread': 70 })
    const front = (pose: typeof out) => characterJoints(who, pose).points['hand.left']
    expect(front(out).x).toBeGreaterThan(front(HUMAN_REST).x + 50)
    // In profile a sideways spread is edge-on: the hand rises but does not move across.
    const side = (pose: typeof out) => characterJoints(who, { ...pose, turn: 1 }).points['hand.left']
    expect(Math.abs(side(out).x - side(HUMAN_REST).x)).toBeLessThan(6)
    // A forward swing is the other way round.
    const forward = humanPose({ 'arm.left.swing': 70 })
    expect(side(forward).x).toBeGreaterThan(side(HUMAN_REST).x + 50)
    expect(Math.abs(front(forward).x - front(HUMAN_REST).x)).toBeLessThan(25)
  })

  it('draws the far arm and leg behind the body, and the near ones in front', () => {
    const order = (turn: number) => {
      const log: string[] = []
      const layers: CharacterLayers = {
        parts: Object.fromEntries(
          ['leg.left', 'leg.right', 'spine', 'arm.left', 'arm.right', 'head'].map((id) => [id, { over: () => void log.push(id) }])
        ),
      }
      drawCharacter(recordingContext().ctx, character({ layers }), humanPose({ turn }))
      return log
    }
    // Facing right, the character's left side is away from the viewer.
    const right = order(1)
    expect(right.indexOf('arm.left')).toBeLessThan(right.indexOf('spine'))
    expect(right.indexOf('arm.right')).toBeGreaterThan(right.indexOf('spine'))
    const left = order(3)
    expect(left.indexOf('arm.right')).toBeLessThan(left.indexOf('spine'))
    expect(left.indexOf('arm.left')).toBeGreaterThan(left.indexOf('spine'))
    // Front-on, arms are in front of the body.
    const front = order(0)
    expect(front.indexOf('arm.left')).toBeGreaterThan(front.indexOf('spine'))
  })

  it('slides the face round: both eyes from the front, one in profile, none from behind', () => {
    const eyes = (turn: number) => {
      const { head } = characterJoints(who, humanPose({ turn }))
      return [0.34, -0.34].filter((x) => faceToScreen(head, [], { x, y: 0.12 }).facing > 0.05).length
    }
    expect(eyes(0)).toBe(2)
    expect(eyes(0.5)).toBe(2)
    expect(eyes(1)).toBe(1)
    expect(eyes(2)).toBe(0)
  })
})

describe('contact', () => {
  const who = character({ height: 300 })

  it('rests the lowest point on the ground, whatever touches it', () => {
    for (const [name, pose] of Object.entries(HUMAN_POSES)) {
      for (const turn of [0, 1, 2.5]) {
        expect(characterJoints(who, { ...pose, turn }).groundY, `${name} at turn ${turn}`).toBeCloseTo(0, 6)
      }
    }
    // Kneeling rests on a knee; crawling on hands and knees.
    const kneel = characterJoints(who, { ...HUMAN_POSES.kneel, turn: 1 })
    expect(kneel.grounded['knee.right']).toBe(true)
    const crawl = characterJoints(who, { ...HUMAN_POSES.crawl, turn: 1 })
    expect(crawl.grounded['knee.left'] || crawl.grounded['hand.left']).toBe(true)
  })

  it('lifts off the ground by `lift`, and keeps the hips put with no contact', () => {
    expect(characterJoints(who, humanPose({ lift: 0.2 })).groundY).toBeCloseTo(-60)
    const floating = character({ height: 300, contact: 'none' })
    const a = characterJoints(floating, HUMAN_REST).points.hip
    const b = characterJoints(floating, HUMAN_POSES.crouch).points.hip
    expect(a.y).toBeCloseTo(b.y)
  })

  it('sits with its hips at the height of its knees', () => {
    const sit = characterJoints(who, { ...HUMAN_POSES.sit, turn: 1 })
    expect(sit.points.hip.y).toBeCloseTo(sit.points['knee.left'].y, 0)
    // Thighs forward: the knees are ahead of the hips, the way it faces.
    expect(sit.points['knee.right'].x).toBeGreaterThan(sit.points.hip.x + 40)
  })
})

describe('reaching', () => {
  const who = character({ height: 300 })

  it('puts the hand on a point in reach, in any view', () => {
    for (const turn of [0, 0.5, 1]) {
      const pose = humanPose({ turn })
      const before = characterJoints(who, pose)
      const target = { x: before.points.neck.x + 50, y: before.points.neck.y + 40 }
      const reached = characterJoints(who, reachCharacter(who, pose, 'arm.right', target))
      close(reached.points['hand.right'], target, 0)
    }
  })

  it('points a straight arm at a point out of reach', () => {
    const pose = humanPose({ turn: 0 })
    const reached = characterJoints(who, reachCharacter(who, pose, 'arm.left', { x: 600, y: -150, depth: 0 }))
    const shoulder = reached.points['shoulder.left']
    const hand = reached.points['hand.left']
    const along = (hand.y - shoulder.y) / (hand.x - shoulder.x)
    expect(along).toBeCloseTo((-150 - shoulder.y) / (600 - shoulder.x), 1)
  })
})

describe('looks', () => {
  beforeAll(() => {
    ;(globalThis as { Path2D?: unknown }).Path2D ??= Path2D
  })

  it('draws the pencil look the same every time, and boils it over time', () => {
    const who = character({ look: 'pencil', height: 300 })
    const at = (time: number) => pixels((ctx) => drawCharacter(ctx, who, HUMAN_POSES.wave, time))
    expect(at(0)).toBe(at(0))
    expect(at(0)).toBe(at(100)) // the same boil frame at 8 a second
    expect(at(0)).not.toBe(at(200))
  })

  it('draws clean, pencil, silhouette, stick and fluid differently', () => {
    const draw = (options: Parameters<typeof character>[0]) => pixels((ctx) => drawCharacter(ctx, character({ height: 300, ...options }), HUMAN_POSES.wave))
    const all = [draw({}), draw({ look: 'pencil' }), draw({ look: 'silhouette' }), draw({ figure: 'stick' }), draw({ proportions: 'thin' })]
    expect(new Set(all).size).toBe(all.length)
  })

  it('calls layer hooks with the pen of the look', () => {
    const looks: string[] = []
    for (const look of ['clean', 'pencil', 'silhouette'] as const) {
      drawCharacter(recordingContext().ctx, character({ look, layers: { front: (_ctx, _j, pen) => void looks.push(pen.look) } }), HUMAN_REST)
    }
    expect(looks).toEqual(['clean', 'pencil', 'silhouette'])
  })
})

describe('poses and targets', () => {
  it('blends poses field by field', () => {
    const half = mixPoses(HUMAN_REST, HUMAN_POSES.wave, 0.5)
    expect(half['arm.right.spread']).toBeCloseTo((HUMAN_REST['arm.right.spread'] + HUMAN_POSES.wave['arm.right.spread']) / 2)
    expect(mixPoses(HUMAN_REST, { turn: 1 }, 0.5).turn).toBe(0.5)
  })

  it('is a canvas target whose pose fields are tracks, and characterAt agrees with it', () => {
    const who = character({ height: 240 })
    const target = characterTarget({ x: 300, y: 500, character: who })
    const timeline: TimelineDefinition = {
      id: 't',
      config: { duration: 1000 },
      tracks: [
        { id: 'turn', target: 'hero', property: 'turn', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 1 }] },
        { id: 'wave', target: 'hero', property: 'arm.right.spread', keyframes: [{ time: 0, value: 12 }, { time: 1000, value: 120 }] },
        { id: 'x', target: 'hero', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 100 }] },
      ],
    }
    const state = { ...deserializeTimeline(timeline).getStateAtTime(600), currentTime: 600 }
    const adapter = new CanvasAdapter()
    adapter.registerTarget('hero', target)
    adapter.applyState(state)
    const { ctx, strokes } = recordingContext()
    adapter.render(ctx)
    expect(strokes.length).toBeGreaterThan(0)
    const { pose, joints } = characterAt(target, { time: 600, state }, 'hero')
    expect(pose.turn).toBeCloseTo(0.6)
    expect(joints.points.hip.x).toBeCloseTo(300 + 60)
    expect(joints.groundY).toBeCloseTo(500)
  })
})

describe('characterPoseTracks', () => {
  it('makes tracks only for fields that move, keeping the view across named poses', () => {
    const tracks = characterPoseTracks('hero', [
      { time: 0, pose: { turn: 1 } },
      { time: 600, pose: 'wave', easing: 'ease-out' },
      { time: 1200, pose: { 'head.nod': 20 } },
    ])
    const fields = tracks.map((t) => t.property)
    expect(fields).toContain('turn')
    expect(fields).toContain('arm.right.spread')
    expect(fields).toContain('head.nod')
    expect(fields).not.toContain('leg.left.knee') // never leaves rest
    const turn = tracks.find((t) => t.property === 'turn')!
    expect(turn.keyframes.map((k) => k.value)).toEqual([1, 1, 1]) // the wave keeps the side view
    const spread = tracks.find((t) => t.property === 'arm.right.spread')!
    expect(spread.keyframes[1]).toEqual({ time: 600, value: HUMAN_POSES.wave['arm.right.spread'], easing: 'ease-out' })
    expect(spread.keyframes[2].value).toBe(HUMAN_POSES.wave['arm.right.spread']) // a partial key builds on the last
  })

  it('names every human field in plain language', () => {
    for (const field of Object.keys(HUMAN_REST)) expect(humanFieldLabel(field), field).not.toBe(field)
    expect(humanFieldLabel('arm.right.spread')).toBe('Right arm · out / in')
  })
})
