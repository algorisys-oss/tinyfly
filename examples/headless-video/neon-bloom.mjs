/**
 * Neon shapes that glow: emissive materials plus the video's `bloom` post-effect.
 * Every motion makes whole turns, so the video loops seamlessly.
 *
 *   npx tinyfly video examples/headless-video/neon-bloom.mjs -o neon.mp4
 *   npx tinyfly video examples/headless-video/neon-bloom.mjs --loop-check
 *
 * `emissive` is light the surface gives off itself: it shows in the dark and,
 * being bright, it is what the bloom picks up and spreads into a glow.
 */
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'

const W = 1280
const H = 720
const END = 4000

const neon = (color) => ({ color: '#000000', emissive: color, shading: 'unlit' })

const scene = loadScene3D({
  id: 'neon',
  camera: 'eye',
  background: '#05030c',
  materials: {
    floor: { color: '#1a1530', shading: 'lambert' },
    pink: neon('#ff2bd6'),
    cyan: neon('#00e5ff'),
    lime: neon('#b6ff3b'),
  },
  objects: [
    { id: 'eye', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 50, position: [0, 2.2, 8], lookAt: [0, 0.9, 0] },
    { id: 'glow', kind: 'light', light: 'point', color: '#ff2bd6', intensity: 0.8, position: [0, 1.5, 0], range: 8 },
    { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [16, 16], segments: 24 }, material: 'floor' },
    { id: 'ring', kind: 'mesh', geometry: { type: 'torus', radius: 1.3, tube: 0.08, segments: 64 }, material: 'pink', position: [0, 1.5, 0] },
    { id: 'inner', kind: 'mesh', geometry: { type: 'torus', radius: 0.8, tube: 0.06, segments: 48 }, material: 'cyan', position: [0, 1.5, 0] },
    { id: 'cube', kind: 'mesh', geometry: { type: 'box', size: [0.5, 0.5, 0.5] }, material: 'lime', position: [0, 1.5, 0] },
  ],
})

export default {
  width: W,
  height: H,
  fps: 30,
  duration: END,
  background: '#05030c',
  // Bright pass, blur, add back: the glow. `true` takes the defaults.
  bloom: { threshold: 0.5, strength: 1 },
  timeline: {
    id: 'neon',
    config: {
      duration: END,
      markers: [{ id: 'glow', time: 0, label: 'Neon shapes glow' }],
    },
    tracks: [
      { id: 'ring', target: 'neon/ring', property: 'rotateX', keyframes: [{ time: 0, value: 0 }, { time: END, value: 360 }] },
      { id: 'inner', target: 'neon/inner', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: END, value: -360 }] },
      { id: 'cube', target: 'neon/cube', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: END, value: 180 }] },
    ],
  },
  draw(ctx, frame) {
    drawScene3D(ctx, scene, frame.state?.values, frame)
  },
}
