import { danceFrame, stickToHuman, mirrorHumanPose, characterObjects } from '../../characters'
import { loadScene3D, drawScene3D, orbitPosition } from '../../scene-3d'

// On a standalone page these come from the browser bundle's `tinyfly` global
// (with tinyfly-scene-3d.iife.js loaded after it); here they come from the
// source modules, so the code below runs unchanged in both.
const tinyfly = { danceFrame, stickToHuman, mirrorHumanPose, characterObjects, loadScene3D, drawScene3D, orbitPosition }

export const html = `<style>
  .c3-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .c3-canvas { width: 100%; max-width: 420px; aspect-ratio: 16 / 9; height: auto; border-radius: 8px; background: #1e293b; }
  .c3-row { display: flex; gap: 8px; align-items: center; font: 12px system-ui, sans-serif; color: #cbd5e1; }
  .c3-row select { font: 12px system-ui, sans-serif; padding: 2px 6px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #e2e8f0; }
  .c3-readout { font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; color: #9bb4c7; }
</style>
<div class="c3-wrap">
  <canvas class="c3-canvas" width="640" height="360"></canvas>
  <div class="c3-row">
    <select class="c3-style" aria-label="Dance">
      <option value="disco">disco</option>
      <option value="hipHop">hip hop</option>
      <option value="bollywood">Bollywood</option>
      <option value="charleston">Charleston</option>
    </select>
    <select class="c3-look" aria-label="Didi's look">
      <option value="solid">Didi: solid</option>
      <option value="pencil">Didi: pencil</option>
    </select>
  </div>
  <div class="c3-readout">camera</div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const canvas = root.querySelector('.c3-canvas')
  const styleSelect = root.querySelector('.c3-style')
  const lookSelect = root.querySelector('.c3-look')
  const readout = root.querySelector('.c3-readout')
  const ctx = canvas.getContext('2d')

  // Two characters on a stage: Tum drawn by its pens, Didi solid (or pencil).
  // The camera is an object like any other; its position is set every frame.
  const sceneFor = (didiLook) =>
    tinyfly.loadScene3D(
      {
        id: 'stage',
        camera: 'cam',
        background: '#1e293b',
        fog: { color: '#1e293b', near: 9, far: 18 },
        materials: { floor: { color: '#334155', shading: 'flat' } },
        objects: [
          { id: 'cam', kind: 'camera', projection: 'perspective', fov: 38, near: 0.1, far: 40, position: [0, 1.4, 6], lookAt: [0, 0.9, 0] },
          { id: 'sun', kind: 'light', light: 'directional', color: '#ffffff', intensity: 0.85, position: [3, 6, 4] },
          { id: 'sky', kind: 'light', light: 'ambient', color: '#9bb4c7', intensity: 0.4 },
          { id: 'floor', kind: 'mesh', layer: -1, geometry: { type: 'plane', size: [12, 12], segments: 8 }, material: 'floor' },
          { id: 'tum', kind: 'character', position: [-0.9, 0, 0], character: { look: 'clean', ink: '#e2e8f0', skin: '#f2c49b', hands: 'cartoon' } },
          didiLook === 'solid'
            ? { id: 'didi', kind: 'character', look: 'solid', position: [0.9, 0, 0], solid: { color: '#7c3aed' } }
            : { id: 'didi', kind: 'character', position: [0.9, 0, 0], character: { look: 'pencil', ink: '#e2e8f0', skin: 'none' } },
        ],
      },
      // Characters come from the characters add-on: the scene JSON names them, this draws them.
      { kinds: [tinyfly.characterObjects] }
    )
  let scene = sceneFor(lookSelect.value)
  lookSelect.addEventListener('change', () => (scene = sceneFor(lookSelect.value)))

  const clock = { time: 0 }
  live.to(clock, { time: 600000, duration: 600, ease: 'none', repeat: -1 })
  const draw = () => {
    const t = clock.time
    // The dance, in beats: Tum dances it, Didi its mirror image.
    const frame = tinyfly.danceFrame(styleSelect.value, (t * 110) / 60000)
    const pose = tinyfly.stickToHuman(frame.pose, frame.hands)
    // The camera orbits once every 16 s and cranes from eye level to high above and back.
    const yaw = (t / 16000) * 360
    const pitch = 8 + 37 * (0.5 - 0.5 * Math.cos((t / 8000) * Math.PI))
    const values = new Map([
      ['stage/tum', new Map(Object.entries(pose))],
      ['stage/didi', new Map(Object.entries(tinyfly.mirrorHumanPose(pose)))],
      ['stage/cam', new Map([['position', tinyfly.orbitPosition([0, 0.9, 0], yaw, pitch, 6)]])],
    ])
    readout.textContent = `camera: orbit ${Math.round(yaw % 360)}°, crane ${Math.round(pitch)}°`
    if (!ctx) return
    tinyfly.drawScene3D(ctx, scene, values, { width: canvas.width, height: canvas.height, time: t })
  }
  live.ticker.add(draw)
  // #endregion code

  return () => live.ticker.remove(draw)
}

/** @type {import('./types').LiveDemo} */
export const characters3d = {
  id: 'live-characters-3d',
  name: '3D Scene: Dancing Characters',
  description:
    'Two v2 characters dance in a 3D scene while the camera orbits and cranes from eye level to high above: Tum drawn by its pens in perspective (face, cartoon hands), Didi as a solid figure of shaded capsules (or in pencil), dancing the mirror image. Their poses come from the dance styles, their shadows sit on the floor, and the same scene renders to video in Node.',
  category: '3d',
  tags: ['3d', 'character', 'dance', 'camera', 'orbit', 'crane', 'pencil', 'solid', 'scene'],
  addons: ['scene-3d'],
  html,
  run,
}
