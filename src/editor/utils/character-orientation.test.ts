import { describe, it, expect, beforeAll } from 'vitest'
import { createCanvas, Path2D } from '@napi-rs/canvas'
import { Timeline } from '../../engine/core/timeline'
import type { Track } from '../../engine/types'
import {
  DANCE_STYLES,
  FLIPS,
  GAGS,
  GAITS,
  HUMAN_REST,
  basicOutfit,
  character,
  characterJoints,
  drawCharacter,
  humanPose,
  type CharacterOptions,
  type CharacterPose,
  type DanceStyleName,
  type FlipName,
  type GagName,
  type GaitName,
} from '../../characters'
import { actingTracks, characterGagKeys, characterWalk, type KeyPose } from './character-acting'
import { characterDanceTracks, characterFlipTracks, type PropertyKeyframes } from './character-dance'

/**
 * Characters of every build, figure, look, outfit and hand style must stay
 * the right way up and face the right way through everything the editor can
 * do to them: acting, gags, walks, dances and flips, in every view.
 */

const H = 200
const BUILDS: Record<string, CharacterOptions> = {
  bold: {},
  thin: { proportions: 'thin' },
  bigHead: { headSize: 0.4 },
  broad: { shoulderWidth: 0.11, hipWidth: 0.05 },
  tall: { height: 320 },
}
/** The views the editor offers by name: front, side, side (left). */
const VIEWS = { front: 0, side: 1, sideLeft: 3 }

const build = (name: string) => character({ height: H, ...BUILDS[name] })
const jointsOf = (name: string, pose: CharacterPose) => characterJoints(build(name), pose)

/** Every joint is a real number. */
function expectFinite(pose: CharacterPose, joints: ReturnType<typeof characterJoints>, label: string) {
  for (const [field, value] of Object.entries(pose)) expect(Number.isFinite(value), `${label}: pose ${field}`).toBe(true)
  for (const [point, p] of Object.entries(joints.points)) expect(Number.isFinite(p.x) && Number.isFinite(p.y), `${label}: ${point}`).toBe(true)
}

/** Which way the feet point on screen: +1 right, -1 left (0 when front-on, too close to call). */
function toesPoint(joints: ReturnType<typeof characterJoints>): number {
  const along = joints.points['toe.left'].x - joints.points['ankle.left'].x + joints.points['toe.right'].x - joints.points['ankle.right'].x
  return Math.abs(along) < 0.01 * joints.height ? 0 : Math.sign(along)
}

/** Poses of a set of tracks at times. */
function posesFrom(tracks: PropertyKeyframes[], times: number[], rest: CharacterPose): CharacterPose[] {
  const timeline = new Timeline({ id: 't', tracks: tracks.map((t, i) => ({ id: `${i}`, target: 'c', property: t.property, keyframes: t.keyframes }) as Track) })
  return times.map((time) => {
    const pose = { ...rest }
    for (const [field, value] of timeline.getStateAtTime(time).values.get('c') ?? []) if (typeof value === 'number' && field in HUMAN_REST) pose[field] = value
    return pose
  })
}
const sampleTimes = (start: number, end: number, step = 40) => Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, i) => start + i * step)

describe('walks keep characters facing the way they walk', () => {
  for (const buildName of Object.keys(BUILDS)) {
    for (const gait of Object.keys(GAITS) as GaitName[]) {
      it(`${buildName}: ${gait}, both ways`, () => {
        for (const direction of [1, -1]) {
          const walk = characterWalk(gait, { start: 0, distance: direction * 300, height: H, pose: humanPose() })
          expect(Math.sign(walk.x.at(-1)!.value as number)).toBe(direction)
          for (const key of walk.keys.slice(2, -2)) {
            const joints = jointsOf(buildName, key.pose)
            const label = `${buildName} ${gait} ${direction} at ${key.time}`
            expectFinite(key.pose, joints, label)
            // On tiptoe a foot can point straight down, but never back the way it came.
            expect(toesPoint(joints), label).not.toBe(-direction)
            expect(joints.head.center.y, `${label}: head above hips`).toBeLessThan(joints.points.hip.y)
            if ((key.pose.lift ?? 0) < 0.005) expect(Object.entries(joints.grounded).some(([p, on]) => on && /ankle|toe/.test(p)), `${label}: a foot down`).toBe(true)
          }
        }
      })
    }
  }
})

describe('gags keep the view, and a take’s arms go up in every view', () => {
  for (const buildName of Object.keys(BUILDS)) {
    for (const [viewName, turn] of Object.entries(VIEWS)) {
      it(`${buildName}, ${viewName}: every gag`, () => {
        const facing = turn === 3 ? -1 : 1
        for (const name of Object.keys(GAGS) as GagName[]) {
          const keys = characterGagKeys(name, { start: 0, pose: humanPose({ turn }), facing })
          const expectedToes = turn === 0 ? 0 : facing
          for (const key of keys) {
            const joints = jointsOf(buildName, key.pose)
            const label = `${buildName} ${viewName} ${name} at ${key.time}`
            expectFinite(key.pose, joints, label)
            expect(key.pose.turn, label).toBe(turn)
            if (expectedToes !== 0) expect(toesPoint(joints), `${label}: toes`).toBe(expectedToes)
            expect(joints.head.center.y, `${label}: head above hips`).toBeLessThan(joints.points.hip.y)
          }
          if (name === 'take') {
            const apex = keys.reduce((a, b) => ((b.pose.lift ?? 0) > (a.pose.lift ?? 0) ? b : a))
            const joints = jointsOf(buildName, apex.pose)
            for (const side of ['left', 'right']) {
              expect(joints.points[`hand.${side}`].y, `${buildName} ${viewName} take: ${side} hand up`).toBeLessThan(joints.points.neck.y)
            }
          }
        }
      })
    }
  }
})

/** Joint names with left and right swapped. */
const swap = (name: string) => name.replace(/\.(left|right)$/, (_, side) => (side === 'left' ? '.right' : '.left'))

describe('dances and flips facing left are the mirror image of facing right', () => {
  for (const style of Object.keys(DANCE_STYLES) as DanceStyleName[]) {
    it(`${style}`, () => {
      const options = { style, bpm: 120, beats: 8, start: 0, height: H }
      const right = characterDanceTracks({ ...options, facing: 1 })
      const left = characterDanceTracks({ ...options, facing: -1 })
      const times = sampleTimes(0, 4000, 125)
      const rightPoses = posesFrom(right, times, { ...HUMAN_REST })
      const leftPoses = posesFrom(left, times, { ...HUMAN_REST, turn: 4 })
      for (let i = 0; i < times.length; i++) {
        const a = jointsOf('bold', rightPoses[i])
        const b = jointsOf('bold', leftPoses[i])
        expectFinite(leftPoses[i], b, `${style} left at ${times[i]}`)
        for (const [name, p] of Object.entries(a.points)) {
          const q = b.points[swap(name)]
          expect(Math.abs(-p.x - q.x) + Math.abs(p.y - q.y), `${style} at ${times[i]}: ${name}`).toBeLessThan(0.02 * H)
        }
      }
      // Travelling dances go the way they face.
      const travel = (tracks: PropertyKeyframes[]) => tracks.find((t) => t.property === 'x')?.keyframes.at(-1)?.value as number | undefined
      const r = travel(right)
      if (r !== undefined && Math.abs(r) > 1) expect(Math.sign(travel(left)!)).toBe(-Math.sign(r))
    })
  }

  for (const flip of Object.keys(FLIPS) as FlipName[]) {
    it(`flip: ${flip}`, () => {
      const right = characterFlipTracks(flip, { start: 0, height: H, facing: 1 })
      const left = characterFlipTracks(flip, { start: 0, height: H, facing: -1 })
      const times = sampleTimes(0, FLIPS[flip].duration, 50)
      const rightPoses = posesFrom(right, times, { ...HUMAN_REST })
      const leftPoses = posesFrom(left, times, { ...HUMAN_REST })
      for (let i = 0; i < times.length; i++) {
        const a = jointsOf('bold', rightPoses[i])
        const b = jointsOf('bold', leftPoses[i])
        // Seen from the other side (same limbs, mirrored) or mirrored front-on (limbs swap sides).
        const worst = (rename: (name: string) => string) =>
          Math.max(...Object.entries(a.points).map(([name, p]) => Math.abs(-p.x - b.points[rename(name)].x) + Math.abs(p.y - b.points[rename(name)].y)))
        const error = Math.min(worst((name) => name), worst(swap))
        expect(error, `${flip} at ${times[i]}`).toBeLessThan(0.03 * H)
      }
      // Flips end upright.
      const end = jointsOf('bold', leftPoses.at(-1)!)
      expect(end.head.center.y).toBeLessThan(end.points.hip.y)
    })
  }
})

describe('acting never spins a character out of its view', () => {
  for (const [viewName, turn] of Object.entries(VIEWS)) {
    it(`${viewName}`, () => {
      const keys: KeyPose[] = [
        { time: 0, pose: humanPose({ turn }) },
        { time: 700, pose: humanPose({ turn, 'arm.right.spread': 140, 'arm.right.elbow': 30, lean: 8 }) },
        { time: 1500, pose: humanPose({ turn, 'arm.left.swing': 70, lean: -6 }) },
        { time: 2600, pose: humanPose({ turn }) },
      ]
      for (const style of ['full', 'snappy', 'limited'] as const) {
        const poses = posesFrom(actingTracks('c', { style, keys }, { ...HUMAN_REST, turn }), sampleTimes(0, 3200), { ...HUMAN_REST, turn })
        for (const pose of poses) {
          expect(Math.abs(pose.turn - turn), `${viewName} ${style}`).toBeLessThan(0.1)
          const joints = jointsOf('bold', pose)
          expect(joints.head.center.y).toBeLessThan(joints.points.hip.y)
          if (turn !== 0) expect(toesPoint(joints), `${viewName} ${style}: toes`).toBe(turn === 3 ? -1 : 1)
        }
      }
    })
  }
})

describe('every look, figure, outfit and hand style draws the action', () => {
  beforeAll(() => {
    ;(globalThis as { Path2D?: unknown }).Path2D ??= Path2D
  })

  const take = characterGagKeys('take', { start: 0, pose: humanPose({ turn: 1 }), facing: 1 })
  const apex = take.reduce((a, b) => ((b.pose.lift ?? 0) > (a.pose.lift ?? 0) ? b : a)).pose
  const stride = characterWalk('run', { start: 0, distance: -400, height: H, pose: humanPose() }).keys[6].pose

  for (const figure of ['fluid', 'stick'] as const) {
    for (const look of ['clean', 'pencil', 'silhouette'] as const) {
      for (const hands of ['dot', 'glove', 'natural'] as const) {
        for (const outfit of [false, true]) {
          it(`${figure}, ${look}, ${hands} hands${outfit ? ', clothed' : ''}`, () => {
            const who = character({
              height: H,
              figure,
              look,
              hands: hands === 'dot' ? 'dot' : 'cartoon',
              handStyle: hands === 'natural' ? 'natural' : 'glove',
              layers: outfit ? basicOutfit({ shirt: '#e4572e', trousers: '#2b4c7e' }) : undefined,
            })
            for (const pose of [apex, stride]) {
              const canvas = createCanvas(300, 320)
              const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
              ctx.translate(150, 290)
              drawCharacter(ctx, who, pose, 0)
              const data = ctx.getImageData(0, 0, 300, 320).data
              let inked = 0
              for (let i = 3; i < data.length; i += 4) if (data[i] > 0) inked++
              expect(inked).toBeGreaterThan(300)
            }
          })
        }
      }
    }
  }
})
