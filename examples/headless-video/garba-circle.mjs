/**
 * Native garba circle: world foot plants, local dance poses and full turns.
 * tinyfly video examples/headless-video/garba-circle.mjs -o garba-circle.mp4
 * tinyfly video examples/headless-video/garba-circle.mjs --loop-check
 */
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'
import { character, characterObjects, danceCircleAt } from '@algorisys/tinyfly/characters'

const width = 960, height = 540, bpm = 120, count = 6
const who = character({ height: 1.7 })
const colors = ['#ef476f', '#ffd166', '#06d6a0', '#a78bfa', '#f97316', '#38bdf8']
const scene = loadScene3D({
  id: 'stage', camera: 'camera', background: '#20152f',
  materials: { floor: { color: '#493559', shading: 'flat' } },
  objects: [
    { id: 'camera', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 40, position: [5, 5, 7], lookAt: [0, 0.65, 0] },
    { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [8, 8] }, material: 'floor' },
    ...colors.map((color, i) => ({
      id: `dancer${i}`, kind: 'character', height: 1.7,
      character: { look: 'clean', figure: 'fluid', skin: '#dda879', ink: '#30243f', hands: 'cartoon', handStyle: 'natural', hair: { style: i % 2 ? 'short' : 'lowBun', color: '#221a25' }, outfit: { shirt: color, trousers: i % 2 ? '#f8e4ba' : color, bottom: i % 2 ? 'trousers' : 'skirt', sleeves: 'short' } },
    })),
  ],
}, { kinds: [characterObjects] })

export default {
  width, height, fps: 30, duration: 16000, loop: true, background: '#20152f',
  draw(ctx, { time }) {
    const members = danceCircleAt(time * bpm / 60000, { radius: 1.8, count, beatsPerTurn: 32, style: 'garba', facing: 'tangent', character: who })
    const values = new Map(members.map((member, i) => {
      const { turn, ...pose } = member.pose
      return [`stage/dancer${i}`, new Map(Object.entries({ ...pose, position: member.position, rotateY: turn * 90 }))]
    }))
    drawScene3D(ctx, scene, values, { width, height, time })
  },
}
