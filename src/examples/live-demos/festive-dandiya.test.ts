import { readFileSync } from 'node:fs'
import { createCanvas } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import * as characters from '../../characters'
import * as scene3d from '../../scene-3d'
import { mat4, vec3 } from '../../engine/math'
import type { CharacterJoints, CharacterLayer, CharacterOptions } from '../../characters/character'
import type { DancePartner } from '../../characters/dance-contact'
import type { Scene3D, CharacterObject3D, LineObject3D } from '../../scene-3d/scene-types'

interface Festival {
  festiveFrame(time: number): { values: scene3d.SceneValues; members: DancePartner[]; meetings: ReturnType<typeof characters.meetDandiya>[]; strike: number }
  drawFestiveDandiya(ctx: CanvasRenderingContext2D, time: number, size: { width: number; height: number }): void
  spinDegrees(beat: number): number
  video?: { duration: number; loop: boolean }
}

function loadFestival(kind: 'live' | 'headless') {
  let json: Scene3D
  const drawn = new Map<string, CharacterJoints>()
  const api = {
    ...characters, ...scene3d,
    loadScene3D: (...[scene, options]: Parameters<typeof scene3d.loadScene3D>) => {
      json = scene
      const objects = scene.objects.map((object) => {
        if (object.kind !== 'character') return object
        const body = object.character as CharacterOptions
        const arm = body.layers?.parts?.['arm.right']
        const over: CharacterLayer = (...args) => {
          drawn.set(object.id, args[1])
          arm?.over?.(...args)
        }
        return { ...object, character: { ...body, layers: { ...body.layers, parts: { ...body.layers?.parts, 'arm.right': { ...arm, over } } } } }
      })
      return scene3d.loadScene3D({ ...scene, objects }, options)
    },
  }
  const canvas = createCanvas(480, 360)
  let festival: Festival
  if (kind === 'live') {
    const source = readFileSync(new URL('./festive-dandiya.js', import.meta.url), 'utf8')
    const code = source.match(/\/\/ #region code\n([\s\S]*?)\/\/ #endregion code/)![1]
    const live = { to() {}, ticker: { add() {} } }
    const root = { querySelector: (selector: string) => selector === '.fd-canvas' ? canvas : { textContent: '' } }
    festival = new Function('tinyfly', 'live', 'root', `${code}\nreturn { festiveFrame, drawFestiveDandiya, spinDegrees };`)(api, live, root)
  } else {
    const source = readFileSync(new URL('../../../examples/headless-video/festive-dandiya.mjs', import.meta.url), 'utf8')
    const code = source.replace(/^import \{(.*?)\} from .*;$/gm, 'const {$1} = tinyfly;')
      .replace(/^export default /m, 'const video = ').replace(/^export /gm, '')
    festival = new Function('tinyfly', `${code}\nreturn { festiveFrame, drawFestiveDandiya, spinDegrees, video };`)(api)
  }
  return { festival, json: json!, drawn, ctx: canvas.getContext('2d') as unknown as CanvasRenderingContext2D }
}

describe.each(['live', 'headless'] as const)('festive dandiya %s geometry', (kind) => {
  it('aligns rendered joints and stick grips throughout strikes, half turns and full spins', () => {
    const { festival, json, drawn, ctx } = loadFestival(kind)
    const bodies = json.objects.filter((object): object is CharacterObject3D => object.kind === 'character')
    const solid = scene3d.loadScene3D({ ...json, objects: json.objects.map((object) => object.kind === 'character' ? { ...object, look: 'solid' as const } : object) }, { kinds: [characters.characterObjects] })
    const length = 1.85 * .28
    let strikes = 0
    for (const beat of [1, 3, 5, 7, 0, .25, 10, 12, 14, 18, 20, 23.5, 48, 1]) {
      const frame = festival.festiveFrame(beat * 500)
      const rendered = scene3d.resolveScene3D(solid, frame.values, { width: 480, height: 360 })
      festival.drawFestiveDandiya(ctx, beat * 500, { width: 480, height: 360 })
      const project = (world: [number, number, number]) => {
        const ndc = mat4.transformPoint(rendered.camera.projection, mat4.transformPoint(rendered.camera.view, world))
        return { x: (ndc[0] + 1) * 240, y: (1 - ndc[1]) * 180 }
      }
      frame.members.forEach((member, index) => {
        const body = bodies[index]
        const who = characters.character(body.character as CharacterOptions)
        expect(member.character.plan.chains).toEqual(who.plan.chains)
        expect(member.character.plan.head).toEqual(who.plan.head)
        for (const field of ['height', 'figure', 'lineWidth', 'hands', 'handStyle', 'handSize', 'contact'] as const) {
          expect(member.character[field]).toEqual(who[field])
        }
        const centers = rendered.meshes.filter((mesh) => mesh.objectId === body.id).map((mesh) => mat4.transformPoint(mesh.world, [0, 0, 0]))
        const joints = drawn.get(body.id)!
        expect(joints).toBeDefined()
        for (const [sideIndex, side] of ['left', 'right'].entries()) {
          const chain = `arm.${side}`
          const elbow = characters.danceJoint(member, chain, 1)
          const wrist = characters.danceJoint(member, chain, 2)
          for (const [jointIndex, world] of [[1, elbow], [2, wrist]] as const) {
            expect(Math.min(...centers.map((center) => vec3.distance(center, world)))).toBeLessThan(1e-9)
            const screen = project(world)
            expect(joints.chains[chain][jointIndex].x).toBeCloseTo(screen.x, 8)
            expect(joints.chains[chain][jointIndex].y).toBeCloseTo(screen.y, 8)
          }
          const stick = json.objects.find((object) => object.id === `stick${index * 2 + sideIndex}`) as LineObject3D
          const [grip, tip] = stick.points!
          const renderedWrist = centers.reduce((a, b) => vec3.distance(a, wrist) < vec3.distance(b, wrist) ? a : b)
          const renderedElbow = centers.reduce((a, b) => vec3.distance(a, elbow) < vec3.distance(b, elbow) ? a : b)
          const expectedGrip = vec3.add(renderedWrist, vec3.scale(vec3.normalize(vec3.subtract(renderedWrist, renderedElbow)), who.lineWidth * .5))
          expect(vec3.distance(grip, expectedGrip)).toBeLessThan(1e-9)
          expect(vec3.distance(grip, tip)).toBeCloseTo(length, 10)
          if (side === 'right' && frame.strike === 1) {
            const meeting = frame.meetings[Math.floor(index / 2)]
            expect(meeting.reached).toBe(true)
            expect(vec3.distance(tip, meeting.point)).toBeLessThan(1.85 * .002)
            expect(vec3.distance(grip, meeting.sticks[index % 2].grip)).toBeLessThan(1e-9)
            strikes++
          }
        }
      })
    }
    expect(strikes).toBeGreaterThanOrEqual(24)
    expect(festival.spinDegrees(12) - festival.spinDegrees(8)).toBe(180)
    expect(festival.spinDegrees(24) - festival.spinDegrees(16)).toBe(360)
    if (festival.video) expect(festival.video).toMatchObject({ duration: 24000, loop: true })
  }, 20000)
})
