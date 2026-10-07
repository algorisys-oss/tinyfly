import { deserializeTimeline } from '../../engine'
import { characterObjects, propObjects, propScript3D, characterScript3D, propRide3D, spliceTracks, RIDING_POSES, car, horse, crow, chicken } from '../../characters'
import { loadScene3D, drawScene3D, orbitPosition } from '../../scene-3d'

// On a standalone page these come from the browser bundle's `tinyfly` global
// (with tinyfly-scene-3d.iife.js loaded after it); here they come from the
// source modules, so the code below runs unchanged in both.
const tinyfly = { deserializeTimeline, characterObjects, propObjects, propScript3D, characterScript3D, propRide3D, spliceTracks, RIDING_POSES, car, horse, crow, chicken, loadScene3D, drawScene3D, orbitPosition }

export const html = `<style>
  .p3-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .p3-canvas { width: 100%; max-width: 420px; aspect-ratio: 16 / 9; height: auto; border-radius: 8px; background: #fbf8ef; }
  .p3-row { display: flex; gap: 8px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .p3-row select { font: 12px system-ui, sans-serif; padding: 2px 6px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .p3-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="p3-wrap">
  <canvas class="p3-canvas" width="640" height="360"></canvas>
  <div class="p3-row">
    <select class="p3-style" aria-label="Style">
      <option value="solid">solid</option>
      <option value="stick">stick (line art)</option>
    </select>
    <select class="p3-look" aria-label="Look">
      <option value="clean">clean</option>
      <option value="pencil">pencil</option>
      <option value="mesh">mesh (lit solids)</option>
    </select>
    <select class="p3-time" aria-label="Time of day">
      <option value="day">day</option>
      <option value="sunset">sunset</option>
      <option value="night">night</option>
    </select>
  </div>
  <div class="p3-readout">camera</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.p3-canvas')
  const styleSelect = root.querySelector('.p3-style')
  const lookSelect = root.querySelector('.p3-look')
  const timeSelect = root.querySelector('.p3-time')
  const readout = root.querySelector('.p3-readout')
  const ctx = canvas.getContext('2d')

  // A village in a 3D scene: props are named by preset, placed in metres, and drawn by the scene's camera.
  // The scene's lights light the props as they light its meshes: a low orange sun at sunset; at night a
  // dim blue moon, with the houses' windows and the car's headlights lit.
  const TIMES = {
    day: { background: '#fbf8ef', lit: 0, lights: [
      { id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.8, position: [4, 8, 5] },
      { id: 'sky', kind: 'light', light: 'ambient', color: '#ffffff', intensity: 0.5 },
    ] },
    sunset: { background: '#f6c39a', lit: 0.4, fog: { color: '#f6c39a', near: 16, far: 40 }, lights: [
      { id: 'sun', kind: 'light', light: 'directional', color: '#ff9a5c', intensity: 1.0, position: [-10, 2.5, 3] },
      { id: 'sky', kind: 'light', light: 'ambient', color: '#b48cc2', intensity: 0.45 },
    ] },
    night: { background: '#1d2438', lit: 1, fog: { color: '#1d2438', near: 14, far: 36 }, lights: [
      { id: 'moon', kind: 'light', light: 'directional', color: '#9fb8ff', intensity: 0.45, position: [5, 9, -4] },
      { id: 'sky', kind: 'light', light: 'ambient', color: '#56648f', intensity: 0.35 },
    ] },
  }
  const sceneFor = (style, look, time) => {
    const sky = TIMES[time]
    const prop = (id, name, extra = {}) => ({ id, kind: 'prop', prop: name, style, look, ink: '#2f2f33', paper: '#fbf8ef', ...extra })
    return tinyfly.loadScene3D(
      {
        id: 'village',
        camera: 'cam',
        background: sky.background,
        ...(sky.fog ? { fog: sky.fog } : {}),
        materials: {
          grass: { color: '#cfe0b4', shading: 'flat' },
          road: { color: '#b9b2a3', shading: 'flat' },
        },
        objects: [
          { id: 'cam', kind: 'camera', projection: 'perspective', fov: 42, near: 0.1, far: 60, position: [0, 3, 12], lookAt: [0, 0.8, 0] },
          ...sky.lights,
          { id: 'grass', kind: 'mesh', layer: -2, geometry: { type: 'plane', size: [26, 26], segments: 18 }, material: 'grass' },
          { id: 'road', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [26, 2.4], segments: 18 }, material: 'road', position: [0, 0.01, 3] },
          prop('house', 'house', { position: [-2.5, 0, -4], values: { lights: sky.lit } }),
          prop('barn', 'house', { position: [3.5, 0, -5], rotation: [0, -25, 0], values: { lights: sky.lit }, options: { colors: { walls: '#c0583f', roof: '#5b4636' } } }),
          prop('oak', 'tree', { position: [-6, 0, -1] }),
          prop('pine', 'tree', { position: [6.5, 0, -1.5], options: { canopy: { shape: 'tall', seed: 3 } } }),
          prop('car', 'car', { position: [-9, 0, 3], rotation: [0, 90, 0], values: { lights: sky.lit } }),
          prop('horse', 'horse', { position: [-1, 0, 2.9], rotation: [0, 90, 0] }),
          prop('crow', 'crow', { position: [0, 0, 5], rotation: [0, 90, 0] }),
          prop('hen', 'chicken', { position: [1.6, 0, 0.6], rotation: [0, -60, 0] }),
          // A pen figure is mostly lines: at night it gets a light ink, so it reads against the dark.
          look === 'mesh'
            ? { id: 'hero', kind: 'character', look: 'solid', position: [0.6, 0, 0.2], solid: { color: '#475569' } }
            : { id: 'hero', kind: 'character', position: [0.6, 0, 0.2], character: { look, ink: time === 'night' ? '#dfe5f0' : '#2f2f33', skin: '#f2c49b', hands: 'cartoon' } },
        ],
      },
      // Characters and props come from the characters add-on: the scene JSON names them, these draw them.
      { kinds: [tinyfly.characterObjects, tinyfly.propObjects] }
    )
  }
  let scene = sceneFor(styleSelect.value, lookSelect.value, timeSelect.value)
  const rebuild = () => (scene = sceneFor(styleSelect.value, lookSelect.value, timeSelect.value))
  for (const input of [styleSelect, lookSelect, timeSelect]) input.addEventListener('change', rebuild)

  // What moves is scripted in world metres: each beat a move to a point (or along a path through points), a
  // turn to face something, or one of the prop's actions. Wheels and strides are keyed with the distance.
  const round = (cx, cz, r, from, count = 8) =>
    Array.from({ length: count + 1 }, (_, i) => {
      const a = from + (i / count) * Math.PI * 2
      return [cx + r * Math.sin(a), cz + r * Math.cos(a)]
    })
  const scripts = [
    tinyfly.propScript3D('car', tinyfly.car(), [
      { do: 'drive', to: [9, 3] },
      { do: 'honk' },
      // Round over the grass and back onto the road where it started.
      { do: 'drive', through: [[11, 4.6], [9, 6.2], [-9, 6.2], [-11, 4.6], [-9, 3]] },
      { do: 'hold', for: 600 },
    ], { scene: 'village', position: [-9, 3], heading: 90 }),
    tinyfly.propScript3D('crow', tinyfly.crow(), [
      { do: 'fly', through: round(0, -1, 6, 0, 10).slice(1), height: 3.2 },
      { do: 'fly', to: [2.4, 1.2], height: 0 },
      { do: 'peck', for: 900 },
      { do: 'caw' },
      { do: 'fly', to: [0, 5], height: 3.2 },
    ], { scene: 'village', position: [0, 5], heading: 90, values: { lift: 3.2 } }),
    tinyfly.propScript3D('hen', tinyfly.chicken(), [
      { do: 'peck', for: 1500 },
      { do: 'walk', to: [2.6, -0.4] },
      { do: 'cluck' },
      { do: 'peck', for: 1200 },
      { do: 'walk', to: [1.6, 0.6] },
      { do: 'flutter' },
    ], { scene: 'village', position: [1.6, 0.6], heading: -60 }),
  ]
  // Tum, a character, walks over to the grazing horse, hops on, rides a lap at a walk and a trot, hops off,
  // waves, does a take and struts back. The horse waits until Tum is up; the ride keeps Tum's hips on its
  // saddle as it goes (propRide3D), spliced into Tum's own script for that stretch.
  const tumStart = { scene: 'village', position: [0.6, 0.2], heading: 0 }
  const beside = [-1, 3.9]
  const mountAt = tinyfly.characterScript3D('hero', [{ do: 'walk', to: beside }], tumStart).duration
  const horse = tinyfly.horse()
  const horseScript = tinyfly.propScript3D('horse', horse, [
    { do: 'graze', for: mountAt + 700 },
    { do: 'walk', through: round(-1, -0.5, 3.4, 0).slice(1, 6) },
    { do: 'trot', through: round(-1, -0.5, 3.4, (5 / 8) * Math.PI * 2).slice(1) },
    { do: 'neigh' },
    { do: 'hold', for: 700 },
  ], { scene: 'village', position: [-1, 2.9], heading: 90 })
  const rideEnd = horseScript.duration
  const [hx, hz] = horseScript.end.position
  const getOff = [hx, hz + 1]
  const tum = tinyfly.characterScript3D('hero', [
    { do: 'walk', to: beside },
    { do: 'pose', pose: tinyfly.RIDING_POSES.astride, for: 450 },
    { do: 'hold', for: rideEnd - mountAt - 900 },
    { do: 'pose', pose: 'rest', for: 450 },
    { do: 'place', to: getOff },
    { do: 'pose', pose: 'wave', for: 500 },
    { do: 'hold', for: 700 },
    { do: 'pose', pose: 'rest', for: 400 },
    { do: 'face', toward: [0, 3] },
    { do: 'gag', gag: 'take' },
    { do: 'strut', to: [0.6, 0.2] },
  ], tumStart)
  const ride = tinyfly.propRide3D({
    prop: horse, propId: 'horse', propTracks: horseScript.tracks, scene: 'village', placement: { position: [-1, 0, 2.9], heading: 90 },
    anchor: 'saddle', riderId: 'hero', pose: tinyfly.RIDING_POSES.astride,
    start: mountAt, end: rideEnd, mount: { from: beside }, dismount: { to: getOff },
  })
  scripts.push(horseScript, { tracks: tinyfly.spliceTracks(tum.tracks, ride, { from: mountAt, to: rideEnd }), duration: tum.duration })
  const length = Math.max(...scripts.map((script) => script.duration)) + 400
  const timeline = tinyfly.deserializeTimeline({ id: 'village', tracks: scripts.flatMap((script) => script.tracks) })

  const clock = { time: 0 }
  live.to(clock, { time: 600000, duration: 600, ease: 'none', repeat: -1 })
  const draw = () => {
    const t = clock.time
    const s = t / 1000
    // The camera orbits once every 24 s and cranes between eye level and high above; the trees sway. Everything else comes from the scripts' timeline, looping.
    const yaw = (t / 24000) * 360
    const pitch = 12 + 26 * (0.5 - 0.5 * Math.cos((t / 12000) * Math.PI))
    const values = new Map(timeline.getStateAtTime(t % length).values)
    values.set('village/cam', new Map([['position', tinyfly.orbitPosition([0, 0.8, -1], yaw, pitch, 19)]]))
    values.set('village/oak', new Map([['sway', 2.5 * Math.sin(s * 1.3)], ['canopySway', 4 * Math.sin(s * 1.3 - 0.6)]]))
    values.set('village/pine', new Map([['sway', 2 * Math.sin(s * 1.1 + 1)], ['canopySway', 3 * Math.sin(s * 1.1 + 0.4)]]))
    readout.textContent = `camera: orbit ${Math.round(yaw % 360)}°, crane ${Math.round(pitch)}°`
    if (!ctx) return
    tinyfly.drawScene3D(ctx, scene, values, { width: canvas.width, height: canvas.height, time: t })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => {
    live.ticker.remove(draw)
    for (const input of [styleSelect, lookSelect, timeSelect]) input.removeEventListener('change', rebuild)
  }
}

/** @type {import('./types').LiveDemo} */
export const props3d = {
  id: 'live-props-3d',
  name: '3D Scene: Village',
  description:
    'Props in a 3D scene, named by preset in the scene JSON and scripted in world metres with propScript3D: a car drives the road, honks and loops back over the grass with its wheels rolling the distance, a horse grazes until Tum hops on, then walks and trots a lap with Tum riding (propRide3D) and its stride keyed to the distance, a crow circles the village, lands to peck and caw and takes off again, a hen pecks, clucks and flutters, and Tum (characterScript3D) walks over, rides, hops off to wave and does a take, while the camera orbits and cranes. Each prop is solved through the scene camera, so it is seen in perspective from any side, drawn with the figures’ pens, solid or as line art.',
  category: '3d',
  tags: ['3d', 'prop', 'car', 'horse', 'bird', 'camera', 'orbit', 'pencil', 'stick', 'scene'],
  addons: ['scene-3d'],
  html,
  run,
}
