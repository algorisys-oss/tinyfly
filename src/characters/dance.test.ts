import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import {
  DANCE_STYLES,
  MUDRAS,
  applyGroove,
  bakeDanceTracks,
  beatAt,
  danceTaps,
  danceFrame,
  dancePose,
  danceStance,
  danceTracks,
  dancer,
  mirrorPose,
  routineBeats,
  type DanceStyle,
  type DanceStyleName,
} from './dance'
import { REST_POSE, stickFigureAt, stickFigureTarget, stickFigureJoints, type StickPose } from './stick-figure'
import { HAND_REST, HAND_SHAPES } from './hands/hand-rig'

const STYLES = Object.keys(DANCE_STYLES) as DanceStyleName[]

const finite = (p: StickPose) => Object.values(p).every(Number.isFinite)

describe('dance styles', () => {
  it('cover disco, hip hop, breaking, jazz, K-pop and Indian styles', () => {
    expect(STYLES).toEqual(expect.arrayContaining(['disco', 'hipHop', 'breaking', 'jazz', 'kpop', 'bollywood', 'bhangra', 'bharatanatyam', 'charleston', 'tap']))
  })

  for (const name of STYLES) {
    it(`${name}: every routine step names a move, and every beat gives a finite pose`, () => {
      const style = DANCE_STYLES[name]
      for (const step of style.routine) expect(style.moves[step.move], step.move).toBeDefined()
      for (let beat = 0; beat < routineBeats(style); beat += 0.125) {
        const frame = danceFrame(style, beat)
        expect(finite(frame.pose), `${name} @ ${beat}`).toBe(true)
        expect(frame.hands?.left).toBeDefined()
        expect(frame.hands?.right).toBeDefined()
      }
    })

    it(`${name}: is plain JSON data`, () => {
      const style = DANCE_STYLES[name]
      expect(JSON.parse(JSON.stringify(style))).toEqual(style)
    })

    it(`${name}: moves change smoothly (no jumps between quarter beats)`, () => {
      const style = DANCE_STYLES[name]
      const step = 1 / 32
      for (let beat = 0; beat < routineBeats(style); beat += step) {
        const a = dancePose(style, beat)
        const b = dancePose(style, beat + step)
        for (const key of ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip', 'lean'] as const) {
          // A snappy hit can travel fast, but never teleport.
          expect(Math.abs(a[key] - b[key]), `${name} ${key} @ ${beat}`).toBeLessThan(60)
        }
      }
    })
  }

  it('keeps the feet on the ground while dancing (unless jumping)', () => {
    for (const name of STYLES) {
      const style = DANCE_STYLES[name]
      for (let beat = 0; beat < routineBeats(style); beat += 0.25) {
        const figure = dancePose(style, beat)
        if (figure.rise > 0) continue
        expect(stickFigureJoints(figure).feetY, `${name} @ ${beat}`).toBeCloseTo(0, 5)
      }
    }
  })
})

describe('moves', () => {
  it('loop: a move repeats every `beats`', () => {
    const at = (beat: number) => dancePose('disco', beat, { move: 'point' })
    for (const key of Object.keys(REST_POSE) as (keyof StickPose)[]) {
      expect(at(2.3)[key], key).toBeCloseTo(at(0.3)[key], 9)
      expect(at(-1.7)[key], key).toBeCloseTo(at(0.3)[key], 9)
    }
  })

  it('hit their keys on the beat', () => {
    const up = dancePose('disco', 0, { move: 'point' })
    const down = dancePose('disco', 1, { move: 'point' })
    expect(up.rightShoulder).toBe(150)
    expect(down.rightShoulder).toBe(-30)
  })

  it('build each key on the previous one, or the stance after a reset', () => {
    const style = DANCE_STYLES.hipHop
    // armWave key 0 resets to the stance and raises both arms; later keys only change some joints.
    const wave = (beat: number) => dancePose(style, beat, { move: 'armWave' })
    expect(wave(0).leftShoulder).toBe(90)
    expect(wave(2).rightShoulder).toBe(102)
    expect(wave(2).leftShoulder).toBe(90)
  })

  it('mirror: left and right swap, leans reverse', () => {
    const plain = dancePose('disco', 0, { move: 'point' })
    const mirrored = dancePose('disco', 0, { move: 'point', mirror: true })
    expect(mirrored.leftShoulder).toBe(plain.rightShoulder)
    expect(mirrored.rightShoulder).toBe(plain.leftShoulder)
    expect(mirrored.lean).toBe(-plain.lean)
    expect(mirrorPose(mirrorPose(plain))).toEqual(plain)
  })

  it('carry hand shapes, mudras by name', () => {
    expect(danceFrame('disco', 0, { move: 'point' }).hands?.right).toEqual(HAND_SHAPES.point)
    expect(danceFrame('bharatanatyam', 0, { move: 'alapadma' }).hands?.right).toEqual(MUDRAS.alapadma)
    expect(danceFrame('bharatanatyam', 0, { move: 'tatta' }).hands?.left).toEqual(MUDRAS.pataka)
  })
})

describe('groove', () => {
  it('bounces lowest on the beat (down) or between beats (up)', () => {
    const hipY = (figure: StickPose) => stickFigureJoints(figure).hip.y
    const down = { bounce: 12, accent: 'down' as const }
    expect(hipY(applyGroove(REST_POSE, down, 0))).toBeGreaterThan(hipY(applyGroove(REST_POSE, down, 0.5)))
    const up = { bounce: 12, accent: 'up' as const }
    expect(hipY(applyGroove(REST_POSE, up, 0.5))).toBeGreaterThan(hipY(applyGroove(REST_POSE, up, 0)))
  })

  it('sways over two beats', () => {
    const groove = { bounce: 0, sway: 4 }
    expect(applyGroove(REST_POSE, groove, 0.5).lean).toBeCloseTo(4)
    expect(applyGroove(REST_POSE, groove, 1.5).lean).toBeCloseTo(-4)
  })
})

describe('routines', () => {
  it('play the steps in order and loop', () => {
    const style = DANCE_STYLES.disco
    expect(routineBeats(style)).toBe(28)
    // Beat 9 is in the roll (beats 8–12), past the blend in: the roll's beat 1.
    const inRoutine = dancePose(style, 9)
    const roll = dancePose(style, 1, { move: 'roll' })
    for (const key of Object.keys(roll) as (keyof StickPose)[]) expect(inRoutine[key], key).toBeCloseTo(roll[key], 6)
    expect(dancePose(style, 1).rightShoulder).toBeCloseTo(dancePose(style, 29).rightShoulder, 6)
  })

  it('blend from one step into the next over half a beat', () => {
    const style = DANCE_STYLES.disco
    const before = dancePose(style, 7.99)
    const at = dancePose(style, 8)
    const after = dancePose(style, 8.5)
    // No jump at the step boundary.
    expect(Math.abs(at.leftShoulder - before.leftShoulder)).toBeLessThan(2)
    expect(after.leftShoulder).toBeCloseTo(dancePose(style, 0.5, { move: 'roll' }).leftShoulder, 6)
  })

  it('are deterministic', () => {
    expect(dancePose('kpop', 13.37)).toEqual(dancePose('kpop', 13.37))
  })

  it('custom styles are plain objects', () => {
    const mine: DanceStyle = {
      label: 'Two-step',
      bpm: 100,
      stance: { leftHip: 12 },
      groove: { bounce: 4 },
      moves: { step: { label: 'Step', beats: 2, keys: [{ beat: 0, pose: { rightHip: 20 } }, { beat: 1, pose: { rightHip: 8, leftHip: 20 } }] } },
      routine: [{ move: 'step', beats: 4 }],
    }
    expect(danceStance(mine).leftHip).toBe(12)
    expect(dancePose(mine, 1, { move: 'step' }).leftHip).toBeGreaterThan(20)
    expect(() => dancePose({ ...mine, routine: [{ move: 'nope', beats: 1 }] }, 0)).toThrow(/no move "nope"/)
  })
})

describe('timing and tracks', () => {
  it('counts beats from time and tempo', () => {
    expect(beatAt(1000, 120)).toBe(2)
    expect(beatAt(1500, 120, 500)).toBe(2)
  })

  it('danceTracks: beat counts at the tempo, dancing fades in and out', () => {
    const [beat, dancing] = danceTracks('tum', { bpm: 120, beats: 8, start: 1000 })
    expect(beat.property).toBe('beat')
    expect(beat.keyframes.map((k) => [k.time, k.value])).toEqual([[1000, 0], [5000, 8]])
    expect(dancing.keyframes[0].value).toBe(0)
    expect(dancing.keyframes[1]).toMatchObject({ time: 1500, value: 1 })
    expect(dancing.keyframes[dancing.keyframes.length - 1]).toMatchObject({ time: 5000, value: 0 })
  })

  it('bakeDanceTracks: pose keyframes that replay the dance', () => {
    const tracks = bakeDanceTracks('tum', 'disco', { move: 'point', bpm: 120 })
    const shoulder = tracks.find((t) => t.property === 'rightShoulder')!
    expect(shoulder.keyframes).toHaveLength(9) // 2 beats × 4 + 1
    expect(shoulder.keyframes[4]).toEqual({ time: 500, value: dancePose('disco', 1, { move: 'point' }).rightShoulder })
    // Joints that never leave rest get no track.
    expect(tracks.find((t) => t.property === 'blink')).toBeUndefined()
  })
})

describe('stick-figure target', () => {
  const frameAt = (beat: number, dancing: number) => {
    const target = stickFigureTarget({ x: 200, y: 400, dance: dancer('disco', { move: 'point' }), style: { hands: {} } })
    const values = new Map([['tum', new Map<string, unknown>([['beat', beat], ['dancing', dancing]])]])
    return stickFigureAt(target, { time: 0, state: { values } as never }, 'tum')
  }

  it('dances by its beat prop, blended in by dancing', () => {
    expect(frameAt(0, 1).pose.rightShoulder).toBeCloseTo(dancePose('disco', 0, { move: 'point' }).rightShoulder)
    expect(frameAt(0, 0).pose.rightShoulder).toBe(REST_POSE.rightShoulder)
    const half = frameAt(0, 0.5).pose.rightShoulder
    expect(half).toBeCloseTo((REST_POSE.rightShoulder + dancePose('disco', 0, { move: 'point' }).rightShoulder) / 2)
  })

  it('draws dancing hands', () => {
    const target = stickFigureTarget({ x: 150, y: 330, dance: dancer('disco'), style: { hands: {} } })
    const ctx = createCanvas(300, 340).getContext('2d') as unknown as CanvasRenderingContext2D
    const draw = (dancing: number) => {
      ctx.clearRect(0, 0, 300, 340)
      ctx.save()
      ctx.translate(target.x, target.y)
      target.draw(ctx, { ...target, props: { ...target.props, beat: 0, dancing } }, 0)
      ctx.restore()
      return ctx.getImageData(0, 0, 300, 340).data.slice()
    }
    const standing = draw(0)
    const dancing = draw(1)
    expect(standing.every((v, i) => v === dancing[i])).toBe(false)
  }, 30000)
})

describe('taps', () => {
  it('lists the foot strikes in a beat window, in order', () => {
    const taps = danceTaps('tap', 0, 1, { move: 'shuffleBallChange' })
    expect(taps).toEqual([
      { beat: 0, tap: 'rightToe' },
      { beat: 0.25, tap: 'rightToe' },
      { beat: 0.5, tap: 'rightToe' },
      { beat: 0.75, tap: 'leftHeel' },
    ])
    // The window is half-open, so consecutive frames never count a tap twice.
    expect(danceTaps('tap', 0, 0.25, { move: 'shuffleBallChange' })).toHaveLength(1)
    expect(danceTaps('tap', 0.25, 0.5, { move: 'shuffleBallChange' })).toHaveLength(1)
  })

  it('loop with the move and the routine', () => {
    const once = danceTaps('tap', 0, 2, { move: 'shuffleBallChange' })
    const again = danceTaps('tap', 2, 4, { move: 'shuffleBallChange' })
    expect(again.map((t) => t.beat - 2)).toEqual(once.map((t) => t.beat))
    const total = routineBeats('tap')
    expect(danceTaps('tap', total, 2 * total).map((t) => t.beat - total)).toEqual(danceTaps('tap', 0, total).map((t) => t.beat))
  })

  it('swap feet on mirrored steps', () => {
    // Beats 12–16 are the time step mirrored: it stamps with the left foot.
    expect(danceTaps('tap', 12, 12.01)).toEqual([
      { beat: 12, tap: 'leftToe' },
      { beat: 12, tap: 'leftHeel' },
    ])
  })

  it('come from keys only: styles without taps are silent, stamps are not', () => {
    expect(danceTaps('disco', 0, routineBeats('disco'))).toEqual([])
    expect(danceTaps('bharatanatyam', 0, 2).map((t) => t.tap)).toEqual(['rightToe', 'rightHeel', 'leftToe', 'leftHeel'])
  })

  it('keep the tapping foot on the floor when it taps', () => {
    for (const tap of danceTaps('tap', 0, routineBeats('tap'))) {
      const joints = stickFigureJoints(dancePose('tap', tap.beat))
      const side = tap.tap.startsWith('left') ? 'left' : 'right'
      const lowest = Math.max(joints.toes[side].y, joints.feet[side].y)
      expect(lowest, `${tap.tap} @ ${tap.beat}`).toBeGreaterThan(joints.feetY - 0.05 * joints.height)
    }
  })
})

describe('side-on dancing', () => {
  it('mirrors side-on by giving the move to the other limbs, still facing the same way', () => {
    const p = { ...dancePose('tap', 0, { move: 'heelToe' }) }
    const mirrored = mirrorPose(p)
    expect(mirrored.leftHip).toBe(-p.rightHip)
    expect(mirrored.rightHip).toBe(-p.leftHip)
    expect(mirrored.lean).toBe(p.lean)
    // Drawn, the forward foot is still in front: the heel dig reaches +x either way.
    const forward = (pose: StickPose) => Math.max(stickFigureJoints(pose).feet.left.x, stickFigureJoints(pose).feet.right.x)
    expect(forward(mirrored)).toBeCloseTo(forward(p), 5)
  })

  it('bounces both knees forward side-on', () => {
    const sideOn = { ...REST_POSE, turn: 1, leftHip: 0, rightHip: 0 }
    const bottom = applyGroove(sideOn, { bounce: 20 }, 0)
    expect(bottom.rightKnee).toBeGreaterThan(0)
    expect(bottom.leftKnee).toBeLessThan(0)
    expect(stickFigureJoints(bottom).hip.y).toBeGreaterThan(stickFigureJoints(sideOn).hip.y)
  })
})

describe('baked hands', () => {
  it('bake hand shapes as hand.left.* / hand.right.* tracks', () => {
    const tracks = bakeDanceTracks('tum', 'disco', { move: 'point', bpm: 120 })
    const index = tracks.find((t) => t.property === 'hand.right.index.curl')!
    expect(index).toBeDefined()
    expect(index.keyframes[0].value).toBe(HAND_SHAPES.point['index.curl'])
    expect(bakeDanceTracks('tum', 'disco', { move: 'point', hands: false }).some((t) => t.property.startsWith('hand.'))).toBe(false)
  })

  it('a target with hands has a prop for every hand field, which its tracks pose', () => {
    const target = stickFigureTarget({ x: 0, y: 0, style: { hands: {} } })
    expect(target.props?.['hand.left.spread']).toBe(HAND_REST.spread)
    const plain = stickFigureTarget({ x: 0, y: 0 })
    expect(plain.props?.['hand.left.spread']).toBeUndefined()
    // Baked tracks set the props; the figure draws those hands.
    const ctx = createCanvas(300, 340).getContext('2d') as unknown as CanvasRenderingContext2D
    const draw = (props: Record<string, number>) => {
      ctx.clearRect(0, 0, 300, 340)
      ctx.save()
      // The target's box sits above its feet at (0, 0); move it onto the canvas.
      ctx.translate(150 + target.x, 330 + target.y)
      target.draw(ctx, { ...target, props: { ...target.props, ...props } }, 0)
      ctx.restore()
      return ctx.getImageData(0, 0, 300, 340).data.slice()
    }
    const relaxed = draw({})
    const fist = draw(Object.fromEntries(Object.entries(HAND_SHAPES.fist).map(([field, value]) => [`hand.right.${field}`, value])))
    expect(relaxed.every((v, i) => v === fist[i])).toBe(false)
  }, 30000)
})
