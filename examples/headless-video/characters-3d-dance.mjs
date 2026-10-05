/**
 * Characters in a 3D scene, rendered to video in Node with no GPU: Tum (drawn
 * by its pens, in perspective) and Didi (solid) dance the mirror image of
 * each other while the camera cranes from eye level to high above, then cuts
 * to a low close shot.
 *
 *   npx tinyfly video examples/headless-video/characters-3d-dance.mjs -o dance-3d.mp4
 *   npx tinyfly video examples/headless-video/characters-3d-dance.mjs --stills stills/
 */
import { loadScene3D, drawScene3D, orbitPosition } from '@algorisys/tinyfly/scene-3d'
import { danceFrame, stickToHuman, mirrorHumanPose, characterObjects } from '@algorisys/tinyfly/characters'

const W = 1280
const H = 720
const CUT = 5000
const END = 8000
const BPM = 112

const scene = loadScene3D(
  {
    id: 'stage',
    camera: 'crane',
    background: '#1e293b',
    fog: { color: '#1e293b', near: 9, far: 18 },
    materials: { floor: { color: '#334155', shading: 'flat' } },
    objects: [
      { id: 'crane', kind: 'camera', projection: 'perspective', fov: 38, near: 0.1, far: 40, position: [0, 1.4, 6], lookAt: [0, 0.9, 0] },
      { id: 'close', kind: 'camera', projection: 'perspective', fov: 32, near: 0.1, far: 40, position: [2.6, 0.5, 3.4], lookAt: [0, 1.1, 0] },
      { id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.85, position: [3, 6, 4] },
      { id: 'sky', kind: 'light', light: 'ambient', color: '#9bb4c7', intensity: 0.4 },
      { id: 'spot', kind: 'light', light: 'spot', color: '#ffd166', intensity: 0.6, position: [0, 6, 1], target: [0, 0, 0], angle: 28, range: 12 },
      { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [14, 14], segments: 28 }, material: 'floor' },
      { id: 'tum', kind: 'character', position: [-0.9, 0, 0], character: { look: 'clean', ink: '#e2e8f0', skin: '#f2c49b', hands: 'cartoon' } },
      { id: 'didi', kind: 'character', look: 'solid', position: [0.9, 0, 0], solid: { color: '#7c3aed' } },
    ],
  },
  { kinds: [characterObjects] }
)

export default {
  width: W,
  height: H,
  fps: 30,
  duration: END,
  background: '#1e293b',
  captions: [
    { id: 'crane', start: 0, end: CUT, text: 'The camera cranes up and around' },
    { id: 'close', start: CUT, end: END, text: 'Cut to the close shot' },
  ],
  draw(ctx, { time }) {
    const frame = danceFrame('disco', (time * BPM) / 60000)
    const pose = stickToHuman(frame.pose, frame.hands)
    const progress = Math.min(1, time / CUT)
    const crane = orbitPosition([0, 0.9, 0], -30 + 120 * progress, 6 + 46 * (0.5 - 0.5 * Math.cos(progress * Math.PI)), 6)
    const values = new Map([
      ['stage', new Map([['activeCamera', time < CUT ? 'crane' : 'close']])],
      ['stage/crane', new Map([['position', crane]])],
      ['stage/tum', new Map(Object.entries(pose))],
      ['stage/didi', new Map(Object.entries(mirrorHumanPose(pose)))],
    ])
    drawScene3D(ctx, scene, values, { width: W, height: H, time })
  },
}
