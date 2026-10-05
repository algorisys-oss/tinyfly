import { Timeline } from '../../engine'
import { loadScene3D, drawScene3D } from '../../scene-3d'

// On a standalone page these come from the browser bundle's `tinyfly` global
// (with tinyfly-scene-3d.iife.js loaded after it); here they come from the
// source modules, so the code below runs unchanged in both.
const tinyfly = { Timeline, loadScene3D, drawScene3D }

export const html = `<style>
  .s3-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .s3-canvas { width: 100%; max-width: 420px; aspect-ratio: 16 / 9; height: auto; border-radius: 8px; background: #1e293b; }
  .s3-row { display: flex; gap: 10px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .s3-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
  .s3-row select { font: 12px system-ui, sans-serif; padding: 2px 6px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
</style>
<div class="s3-wrap">
  <canvas class="s3-canvas" width="640" height="360"></canvas>
  <div class="s3-row">
    <select class="s3-look" aria-label="Shading">
      <option value="toon">toon + ink</option>
      <option value="lambert">smooth</option>
      <option value="flat">flat</option>
      <option value="unlit">unlit</option>
    </select>
    <label><input type="checkbox" class="s3-fog" checked /> fog</label>
  </div>
  <div class="s3-readout">orbit 0°</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.s3-canvas')
  const look = root.querySelector('.s3-look')
  const fog = root.querySelector('.s3-fog')
  const readout = root.querySelector('.s3-readout')
  const ctx = canvas.getContext('2d')

  // The scene is plain JSON: metres, +y up. The camera rides on a "rig"
  // group, so turning the rig orbits the camera while it looks at the middle.
  const sceneFor = (shading, withFog) => ({
    id: 'stage',
    camera: 'cam',
    background: '#1e293b',
    fog: withFog ? { color: '#1e293b', near: 9, far: 20 } : undefined,
    materials: Object.fromEntries(
      Object.entries({ floor: '#334155', red: '#ef4444', blue: '#4a9eff', gold: '#f1c40f', green: '#2ecc71' }).map(([name, color]) => [
        name,
        {
          color,
          shading: name === 'floor' ? 'flat' : shading,
          bands: 3,
          outline: shading === 'toon' && name !== 'floor' ? { width: 2, color: '#0f172a' } : undefined,
        },
      ])
    ),
    objects: [
      { id: 'rig', kind: 'group' },
      { id: 'cam', kind: 'camera', parent: 'rig', projection: 'perspective', fov: 45, near: 0.1, far: 60, position: [0, 3, 9], lookAt: [0, 0.7, 0] },
      { id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.9, position: [4, 6, 3] },
      { id: 'sky', kind: 'light', light: 'ambient', color: '#9bb4c7', intensity: 0.35 },
      { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [16, 16], segments: 8 }, material: 'floor' },
      { id: 'box', kind: 'mesh', geometry: { type: 'box', size: [1.4, 1.4, 1.4] }, material: 'red', position: [-2.2, 0.7, 0] },
      { id: 'ball', kind: 'mesh', geometry: { type: 'sphere', radius: 0.7, segments: 24 }, material: 'blue', position: [0, 0.7, 1.2] },
      { id: 'cone', kind: 'mesh', geometry: { type: 'cone', radius: 0.7, height: 1.6, segments: 24 }, material: 'gold', position: [2.2, 0.8, 0] },
      { id: 'ring', kind: 'mesh', geometry: { type: 'torus', radius: 0.7, tube: 0.22, segments: 32 }, material: 'green', position: [0, 1.4, -2.4] },
      // Any SVG path made solid: a star, 1.4 m wide and 0.3 m deep.
      {
        id: 'star',
        kind: 'mesh',
        geometry: { type: 'extrude', path: 'M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z', depth: 0.3, width: 1.4 },
        material: 'gold',
        position: [0, 2.6, 0],
      },
    ],
  })

  // The motion is ordinary tracks, addressed <scene>/<object>.
  const timeline = new tinyfly.Timeline({
    id: 'orbit',
    tracks: [
      { id: 'orbit', target: 'stage/rig', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: 12000, value: 360 }] },
      { id: 'spin', target: 'stage/box', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: 6000, value: 360 }] },
      { id: 'roll', target: 'stage/ring', property: 'rotateX', keyframes: [{ time: 0, value: 0 }, { time: 4000, value: 360 }] },
      { id: 'twirl', target: 'stage/star', property: 'rotateY', keyframes: [{ time: 0, value: 0 }, { time: 3000, value: 360 }] },
      {
        id: 'bounce',
        target: 'stage/ball',
        property: 'y',
        keyframes: [
          { time: 0, value: 0.7 },
          { time: 500, value: 2.2, easing: 'ease-out' },
          { time: 1000, value: 0.7, easing: 'ease-in' },
        ],
      },
    ],
  })

  let scene = tinyfly.loadScene3D(sceneFor(look.value, fog.checked))
  const rebuild = () => (scene = tinyfly.loadScene3D(sceneFor(look.value, fog.checked)))
  look.addEventListener('change', rebuild)
  fog.addEventListener('change', rebuild)

  const clock = { time: 0 }
  live.to(clock, { time: 600000, duration: 600, ease: 'none', repeat: -1 })
  const draw = () => {
    // The bounce loops every second, the orbit every 12: each track at its own time.
    const t = clock.time
    const state = timeline.getStateAtTime(t % 12000)
    const ball = timeline.getStateAtTime(t % 1000).values.get('stage/ball')
    state.values.set('stage/ball', ball)
    readout.textContent = `orbit ${Math.round(state.values.get('stage/rig').get('rotateY'))}° · ${scene.scene.objects.length} objects`
    if (!ctx) return
    tinyfly.drawScene3D(ctx, scene, state.values, { width: canvas.width, height: canvas.height })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const scene3dOrbit = {
  id: 'live-scene-3d-orbit',
  name: '3D Scene: Orbiting Camera',
  description:
    'A real 3D scene as JSON (camera, lights, a floor, four shapes and a star extruded from an SVG path, in metres) drawn on a plain canvas by tinyfly/scene-3d: toon bands with ink outlines, smooth or flat shading, and fog. The camera orbits because its parent group turns on a rotateY track; a ball bounces and shapes spin, all ordinary keyframes addressed stage/<object>. No WebGL, and the same scene renders to video in Node.',
  category: '3d',
  tags: ['3d', 'scene', 'camera', 'orbit', 'lights', 'toon', 'outline', 'fog', 'canvas'],
  addons: ['scene-3d'],
  html,
  run,
}
