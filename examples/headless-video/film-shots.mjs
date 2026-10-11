/**
 * A film from a 3D scene, as data: a shot list with cuts and transitions,
 * camera moves written as tracks, a handheld close-up, and a widescreen
 * letterbox.
 *
 *   npx tinyfly video examples/headless-video/film-shots.mjs -o film.mp4
 *   npx tinyfly video examples/headless-video/film-shots.mjs --stills stills/
 *
 * `shotTracks` turns the shot list into the scene's `activeCamera` track (a
 * cut is one keyframe); `transitionAt` says when a frame falls inside a
 * crossfade, a dip or a wipe, and `drawTransition` draws both shots blended.
 * `cameraMoveTracks` writes a dolly-in on the wide camera and an orbit on the
 * second; `cameraHandheldTracks` adds a seeded shake to the close shot. Every
 * frame is drawn from its time, so the film renders the same in any order.
 */
import { loadScene3D, drawScene3D, shotTracks, shotMarkers, transitionAt, withActiveCamera, cameraMoveTracks, cameraHandheldTracks, orbitPosition } from '@algorisys/tinyfly/scene-3d'
import { drawLetterbox, drawTransition } from '@algorisys/tinyfly/adapters'

const W = 1280
const H = 720
const END = 10000

const paint = (color, extra = {}) => ({ color, shading: 'toon', bands: 3, outline: { width: 3, color: '#0f172a' }, ...extra })
const scene = loadScene3D({
  id: 'set',
  camera: 'wide',
  background: '#1e293b',
  fog: { color: '#1e293b', near: 10, far: 26 },
  materials: { floor: { color: '#334155', shading: 'flat' }, red: paint('#ef4444'), blue: paint('#4a9eff', { shading: 'lambert', outline: undefined }), gold: paint('#f1c40f'), green: paint('#2ecc71') },
  objects: [
    { id: 'wide', kind: 'camera', projection: 'perspective', fov: 40, near: 0.1, far: 60, position: orbitPosition([0, 0.8, 0], 20, 18, 11), lookAt: [0, 0.8, 0] },
    { id: 'orbiter', kind: 'camera', projection: 'perspective', fov: 45, near: 0.1, far: 60, position: orbitPosition([0, 0.8, 0], -60, 25, 8), lookAt: [0, 0.8, 0] },
    { id: 'close', kind: 'camera', projection: 'perspective', fov: 35, near: 0.1, far: 60, position: [1.2, 1.4, 3.6], lookAt: [0, 0.75, 1.3] },
    { id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.9, position: [4, 6, 3] },
    { id: 'sky', kind: 'light', light: 'ambient', color: '#9bb4c7', intensity: 0.35 },
    { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [18, 18], segments: 36 }, material: 'floor' },
    { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1.4, 1.4, 1.4] }, material: 'red', position: [-2.4, 0.7, 0] },
    { id: 'ball', kind: 'mesh', geometry: { type: 'sphere', radius: 0.75, segments: 32 }, material: 'blue', position: [0, 0.75, 1.3] },
    { id: 'cone', kind: 'mesh', geometry: { type: 'cone', radius: 0.75, height: 1.7, segments: 32 }, material: 'gold', position: [2.4, 0.85, 0] },
    { id: 'ring', kind: 'mesh', geometry: { type: 'torus', radius: 0.8, tube: 0.25, segments: 40 }, material: 'green', position: [0, 1.5, -2.6] },
  ],
})

// The shot list: a dolly in on the wide shot, a crossfade to an orbit, a dip to black into a handheld close-up.
const shots = [
  { id: 'establish', start: 0, end: 4000, camera: 'wide', label: 'Establishing: dolly in' },
  { id: 'orbit', start: 4000, end: 7500, camera: 'orbiter', label: 'Orbit round the set', transition: { kind: 'crossfade', duration: 700 } },
  { id: 'close', start: 7500, end: END, camera: 'close', label: 'Handheld close-up on the ball', transition: { kind: 'dipToBlack', duration: 600 } },
]

const tracks = [
  ...shotTracks(shots, 'set'),
  ...cameraMoveTracks({ scene: 'set', camera: 'wide', start: 0, end: 4000, from: { target: [0, 0.8, 0], yaw: 20, pitch: 18, distance: 11 }, to: { distance: 7, pitch: 12 } }),
  ...cameraMoveTracks({ scene: 'set', camera: 'orbiter', start: 4000, end: 7500, from: { target: [0, 0.8, 0], yaw: -60, pitch: 25, distance: 8 }, to: { yaw: 40 }, easing: 'linear' }),
  ...cameraHandheldTracks([], { scene: 'set', camera: 'close', start: 7500, end: END, base: { position: [1.2, 1.4, 3.6], lookAt: [0, 0.75, 1.3] }, seed: 'close', amount: 0.03, aim: 0.06 }),
  { id: 'spin', target: 'set/box', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: END, value: 360 }] },
  { id: 'roll', target: 'set/ring', property: 'rotateX', keyframes: [{ time: 0, value: 0 }, { time: END, value: 540 }] },
]

export default {
  width: W,
  height: H,
  fps: 30,
  duration: END,
  background: '#000000',
  timeline: { id: 'film', config: { duration: END, markers: shotMarkers(shots) }, tracks },
  draw(ctx, frame) {
    const values = frame.state?.values
    const transition = transitionAt(shots, frame.time)
    if (transition) {
      drawTransition(ctx, transition, { width: W, height: H, draw: (c, camera) => drawScene3D(c, scene, withActiveCamera(values, 'set', camera), frame) })
    } else {
      drawScene3D(ctx, scene, values, frame)
    }
  },
  overlay(ctx) {
    drawLetterbox(ctx, { width: W, height: H }, '2.39:1')
  },
}
