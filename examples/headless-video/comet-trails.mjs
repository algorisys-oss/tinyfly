/**
 * Comets with glowing tails around a planet, rendered in Node, looping
 * seamlessly.
 *
 *   npx tinyfly video examples/headless-video/comet-trails.mjs -o comets.mp4
 *   npx tinyfly video examples/headless-video/comet-trails.mjs --loop-check
 *
 * A `trail` object follows another object: a band through where it was over
 * the last `length` ms. The video frame tells the scene where things were at
 * earlier times, so `drawScene3D(ctx, scene, values, frame)` is all it takes.
 * `period` wraps the trail at the loop, so the first frame already has the
 * last lap's tail and the video loops without a seam.
 */
import { loadScene3D, drawScene3D } from '@algorisys/tinyfly/scene-3d'

const W = 1280
const H = 720
const LAP = 4000

const ring = Array.from({ length: 97 }, (_, i) => {
  const a = (i / 96) * Math.PI * 2
  return [3.2 * Math.cos(a), 0.02, 3.2 * Math.sin(a)]
})

const scene = loadScene3D({
  id: 'sky',
  camera: 'eye',
  background: '#05030c',
  fog: { color: '#05030c', near: 6, far: 16 },
  materials: {
    planet: { color: '#1e1b4b', shading: 'lambert', outline: { width: 3, color: '#a78bfa' } },
    floor: { color: '#120f22', shading: 'flat' },
  },
  objects: [
    { id: 'eye', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 50, position: [0, 2.4, 8], lookAt: [0, 1, 0] },
    { id: 'key', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.8, position: [3, 5, 4] },
    { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [20, 20], segments: 10 }, material: 'floor' },
    { id: 'planet', kind: 'mesh', geometry: { type: 'sphere', radius: 0.9, segments: 40 }, material: 'planet', position: [0, 1.2, 0] },
    // Each comet is an empty group on a tilted, spinning group.
    { id: 'orbitA', kind: 'group', position: [0, 1.2, 0], rotation: [0, 0, 25] },
    { id: 'a', kind: 'group', parent: 'orbitA', position: [2.2, 0, 0] },
    { id: 'orbitB', kind: 'group', position: [0, 1.2, 0], rotation: [0, 0, -40] },
    { id: 'b', kind: 'group', parent: 'orbitB', position: [0, 0, 1.8] },
    { id: 'tailA', kind: 'trail', follow: 'a', length: 1600, samples: 96, width: 0.12, color: '#00e5ff', blend: 'add', period: LAP },
    { id: 'tailB', kind: 'trail', follow: 'b', length: 1200, samples: 96, width: 0.1, color: '#ff2bd6', blend: 'add', period: LAP },
    // A line: a glowing ring on the floor.
    { id: 'ring', kind: 'line', points: ring, width: 0.04, color: '#b6ff3b' },
  ],
})

export default {
  width: W,
  height: H,
  fps: 30,
  duration: LAP,
  background: '#05030c',
  bloom: { threshold: 0.5 },
  timeline: {
    id: 'comets',
    config: {
      duration: LAP,
      markers: [{ id: 'comets', time: 0, label: 'Comets trail light around the planet' }],
    },
    tracks: [
      // Whole turns over the lap, so the motion repeats exactly.
      { id: 'a', target: 'sky/orbitA', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: LAP, value: 720 }] },
      { id: 'b', target: 'sky/orbitB', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: LAP, value: -1080 }] },
    ],
  },
  draw(ctx, frame) {
    drawScene3D(ctx, scene, frame.state?.values, frame)
  },
}
