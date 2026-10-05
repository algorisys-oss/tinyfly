/**
 * A 3D scene rendered to video in Node, with no browser and no GPU: the
 * camera orbits lit shapes on a floor, then cuts to a high wide shot.
 *
 *   npx tinyfly video examples/headless-video/scene-3d-orbit.mjs -o orbit.mp4
 *   npx tinyfly video examples/headless-video/scene-3d-orbit.mjs --stills stills/
 *
 * The scene is JSON and the motion is a timeline, addressed `stage/<object>`.
 * The camera rides on a "rig" group, so a rotateY track on the rig orbits it;
 * an `activeCamera` track on the scene cuts to the other camera.
 */
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'

const W = 1280
const H = 720
const ORBIT = 6000
const CUT = 6000
const END = 9000

const paint = (color, extra = {}) => ({ color, shading: 'toon', bands: 3, outline: { width: 3, color: '#0f172a' }, ...extra })

const scene = loadScene3D({
  id: 'stage',
  camera: 'orbiting',
  background: '#1e293b',
  fog: { color: '#1e293b', near: 10, far: 24 },
  materials: {
    floor: { color: '#334155', shading: 'flat' },
    red: paint('#ef4444'),
    blue: paint('#4a9eff', { shading: 'lambert', outline: undefined }),
    gold: paint('#f1c40f'),
    green: paint('#2ecc71'),
  },
  objects: [
    { id: 'rig', kind: 'group' },
    { id: 'orbiting', kind: 'camera', parent: 'rig', projection: 'perspective', fov: 40, near: 0.1, far: 60, position: [0, 2.6, 9], lookAt: [0, 0.8, 0] },
    { id: 'wide', kind: 'camera', projection: 'perspective', fov: 50, near: 0.1, far: 60, position: [7, 8, 7], lookAt: [0, 0.5, 0] },
    { id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.9, position: [4, 6, 3] },
    { id: 'sky', kind: 'light', light: 'ambient', color: '#9bb4c7', intensity: 0.35 },
    { id: 'spot', kind: 'light', light: 'spot', color: '#ffd166', intensity: 0.8, position: [0, 6, 0], target: [0, 0, 0], angle: 25, range: 14 },
    { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [18, 18], segments: 36 }, material: 'floor' },
    { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1.4, 1.4, 1.4] }, material: 'red', position: [-2.4, 0.7, 0] },
    { id: 'ball', kind: 'mesh', geometry: { type: 'sphere', radius: 0.75, segments: 32 }, material: 'blue', position: [0, 0.75, 1.3] },
    { id: 'cone', kind: 'mesh', geometry: { type: 'cone', radius: 0.75, height: 1.7, segments: 32 }, material: 'gold', position: [2.4, 0.85, 0] },
    { id: 'ring', kind: 'mesh', geometry: { type: 'torus', radius: 0.8, tube: 0.25, segments: 40 }, material: 'green', position: [0, 1.5, -2.6] },
  ],
})

// The ball's bounce, one second at a time, for the whole video.
const bounce = []
for (let t = 0; t <= END; t += 1000) {
  bounce.push({ time: t, value: 0.75, easing: 'ease-in' })
  if (t + 500 <= END) bounce.push({ time: t + 500, value: 2.3, easing: 'ease-out' })
}

export default {
  width: W,
  height: H,
  fps: 30,
  duration: END,
  background: '#1e293b',
  timeline: {
    id: 'orbit',
    config: {
      markers: [
        { id: 'orbit', time: 0, label: 'The camera orbits on its rig' },
        { id: 'wide', time: CUT, label: 'Cut to the wide shot' },
      ],
    },
    tracks: [
      { id: 'orbit', target: 'stage/rig', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: ORBIT, value: 300, easing: 'ease-in-out' }] },
      { id: 'cut', target: 'stage', property: 'activeCamera', keyframes: [{ time: 0, value: 'orbiting' }, { time: CUT, value: 'wide' }] },
      { id: 'spin', target: 'stage/box', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: END, value: 540 }] },
      { id: 'roll', target: 'stage/ring', property: 'rotateX', keyframes: [{ time: 0, value: 0 }, { time: END, value: 720 }] },
      { id: 'bounce', target: 'stage/ball', property: 'y', keyframes: bounce },
    ],
  },
  draw(ctx, frame) {
    drawScene3D(ctx, scene, frame.state?.values, frame)
  },
}
